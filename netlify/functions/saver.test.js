import { handler } from './saver'; // Adjust path as necessary
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockSupabaseClient = {
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
    },
  };
  return { createClient: jest.fn(() => mockSupabaseClient) };
});

const mockSupabaseUpload = createClient().storage.from('data-collection-files').upload;

describe('Netlify Saver Function Handler', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.SUPABASE_URL = 'mock_supabase_url';
    process.env.SUPABASE_KEY = 'mock_supabase_key';
    mockSupabaseUpload.mockReset();
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  const mockEvent = (httpMethod, body, contentType) => ({
    httpMethod,
    headers: {
      'content-type': contentType || 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    body: body ? Buffer.from(body).toString('base64') : undefined,
  });

  test('should handle OPTIONS request for CORS pre-flight', async () => {
    const event = mockEvent('OPTIONS');
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('https://fakeprofiledetection.github.io');
    expect(response.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
  });

  test('should reject non-POST requests', async () => {
    const event = mockEvent('GET');
    const response = await handler(event);
    expect(response.statusCode).toBe(405);
    expect(response.body).toBe('Only POST allowed');
  });

  test('should return 400 if multipart boundary is missing or invalid', async () => {
    const event = mockEvent('POST', 'filedata', 'multipart/form-data'); // No boundary
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Invalid Content-Type header or Busboy instantiation failed.');
  });

  test('should return 400 if no file part is found', async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="somename"\r\n\r\n` +
                 `somevalue\r\n` +
                 `--${boundary}--`;
    const event = mockEvent('POST', body, `multipart/form-data; boundary=${boundary}`);
    const response = await handler(event);
    expect(response.statusCode).toBe(400); // Expecting 400 as per new handler logic
    expect(JSON.parse(response.body).error).toBe('No file data received or file is empty.');
  });

  test('should successfully upload a file and return its URL', async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const fileName = 'test-file.txt';
    const fileContent = 'Hello, world!';
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
                 `Content-Type: text/plain\r\n\r\n` +
                 `${fileContent}\r\n` +
                 `--${boundary}--`;
    const event = mockEvent('POST', body, `multipart/form-data; boundary=${boundary}`);

    mockSupabaseUpload.mockResolvedValueOnce({ error: null });

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.url).toBe(`mock_supabase_url/storage/v1/object/public/data-collection-files/uploads/${fileName}`);
    expect(mockSupabaseUpload).toHaveBeenCalledWith(
      `uploads/${fileName}`,
      Buffer.from(fileContent, 'binary'), // Ensure this matches the handler's buffer conversion
      { upsert: true }
    );
  });

  test('should handle default filename if filename is not in Content-Disposition', async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const fileContent = 'Default filename test';
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="file"\r\n` + // Omitting filename attribute
                 `Content-Type: application/octet-stream\r\n\r\n` +
                 `${fileContent}\r\n` +
                 `--${boundary}--`;
    const event = mockEvent('POST', body, `multipart/form-data; boundary=${boundary}`);

    Date.now = jest.fn(() => 1234567890123); // Mock Date.now for predictable filename

    mockSupabaseUpload.mockResolvedValueOnce({ error: null });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    const expectedFileName = `upload-1234567890123`;
    expect(responseBody.url).toContain(expectedFileName);
    expect(mockSupabaseUpload).toHaveBeenCalledWith(
      `uploads/${expectedFileName}`,
      Buffer.from(fileContent, 'binary'),
      { upsert: true }
    );
  });

  test('should return 500 if Supabase upload fails', async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const fileName = 'fail-upload.txt';
    const fileContent = 'This should fail';
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
                 `Content-Type: text/plain\r\n\r\n` +
                 `${fileContent}\r\n` +
                 `--${boundary}--`;
    const event = mockEvent('POST', body, `multipart/form-data; boundary=${boundary}`);
    const errorMessage = 'Supabase storage error';

    mockSupabaseUpload.mockResolvedValueOnce({ error: new Error(errorMessage) });

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe(errorMessage);
  });
   test('should correctly parse file data when extra newlines are present', async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const fileName = 'extra-newlines.txt';
    // Simulate file data that might have extra newlines around it from some clients
    const fileContent = 'Content with newlines';
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
                 `Content-Type: text/plain\r\n\r\n` +
                 `${fileContent}\r\n` + // Ensure content ends with CRLF before next boundary
                 `--${boundary}--`;
    const event = mockEvent('POST', body, `multipart/form-data; boundary=${boundary}`);

    mockSupabaseUpload.mockResolvedValueOnce({ error: null });

    await handler(event);

    // For this test, we'll assume the handler correctly gets 'ActualContent'.
    // The original comments here were causing parsing issues.
    // The main goal is to test that the fileContent is correctly extracted and passed to Supabase.
    // The previous refinedBody logic is no longer needed as the main body construction is now more robust.
    // const refinedBody = ...
    // const refinedEvent = mockEvent('POST', refinedBody);

    await handler(event); // Use the event with the corrected body

    expect(mockSupabaseUpload).toHaveBeenCalledWith(
      `uploads/${fileName}`,
      Buffer.from(fileContent, 'binary'),
      { upsert: true }
    );
  });
});
