module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\.js$": "babel-jest"
  },
  moduleNameMapper: {
    "\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  setupFilesAfterEnv: ["./jest.setup.js"]
};
