# 🔍 Web Data Collection System

A comprehensive web application for collecting keystroke dynamics data from participants in a controlled research environment. This system implements a complete user journey from consent to data collection across multiple social media platforms.

## 🎯 System Overview

This research platform collects typing dynamics data through an 18-task study spanning Facebook, Instagram, and Twitter interfaces. The system includes automated consent management, demographic data collection, real-time keystroke capture, and MTurk integration for participant compensation.

## 🔄 System Architecture & Flow

```mermaid
stateDiagram-v2
    [*] --> Entry
    
    %% Entry and Environment Detection
    Entry --> EnvironmentDetection
    EnvironmentDetection --> LocalDev : localhost detected
    EnvironmentDetection --> Production : github.io detected
    
    %% Environment-specific API routing
    LocalDev --> APIConfig_Local : data-handler:8888
    Production --> APIConfig_Prod : saver or data-handler
    
    %% User ID Management
    APIConfig_Local --> UserIDCheck
    APIConfig_Prod --> UserIDCheck
    UserIDCheck --> GenerateUserID : no cookie found
    UserIDCheck --> ExistingUserID : cookie exists
    GenerateUserID --> SetUserCookie
    SetUserCookie --> ConsentPage
    ExistingUserID --> ConsentPage
    
    %% Consent Flow
    ConsentPage --> ConsentValidation
    ConsentValidation --> ConsentError : validation fails
    ConsentValidation --> ConsentUpload : form valid
    ConsentError --> ConsentPage
    ConsentUpload --> UploadConsentData
    UploadConsentData --> ConsentUploadError : upload fails
    UploadConsentData --> DemographicsPage : upload success
    ConsentUploadError --> ConsentPage
    
    %% Demographics Flow
    DemographicsPage --> DemographicsValidation
    DemographicsValidation --> DemographicsError : validation fails
    DemographicsValidation --> DemographicsUpload : form valid
    DemographicsError --> DemographicsPage
    DemographicsUpload --> UploadDemographicsData
    UploadDemographicsData --> DemographicsUploadError : upload fails
    UploadDemographicsData --> TasksPage : upload success
    DemographicsUploadError --> DemographicsPage
    
    %% Tasks Flow
    TasksPage --> TaskInitialization
    TaskInitialization --> StartKeystrokeLogging
    StartKeystrokeLogging --> TaskExecution
    
    %% Task Execution States
    TaskExecution --> FacebookTask : platform = facebook
    TaskExecution --> InstagramTask : platform = instagram  
    TaskExecution --> TwitterTask : platform = twitter
    
    %% Platform-specific task states
    FacebookTask --> KeystrokeCollection_FB
    InstagramTask --> KeystrokeCollection_IG
    TwitterTask --> KeystrokeCollection_TW
    
    %% Keystroke Collection (parallel process)
    KeystrokeCollection_FB --> TaskCompletion_FB
    KeystrokeCollection_IG --> TaskCompletion_IG
    KeystrokeCollection_TW --> TaskCompletion_TW
    
    TaskCompletion_FB --> UploadTaskData
    TaskCompletion_IG --> UploadTaskData
    TaskCompletion_TW --> UploadTaskData
    
    %% Task Data Upload
    UploadTaskData --> TaskUploadError : upload fails
    UploadTaskData --> NextTask : more tasks remain
    UploadTaskData --> AllTasksComplete : all 18 tasks done
    TaskUploadError --> TaskExecution
    NextTask --> TaskExecution
    
    %% Completion Flow
    AllTasksComplete --> CompletionPage
    CompletionPage --> GenerateSurveyCode
    GenerateSurveyCode --> StoreCompletionData
    StoreCompletionData --> CompletionUploadError : upload fails
    StoreCompletionData --> DisplaySurveyCode : upload success
    CompletionUploadError --> CompletionPage
    DisplaySurveyCode --> MTurkValidation
    
    %% MTurk Validation Flow
    MTurkValidation --> CodeValidation
    CodeValidation --> InvalidCode : code invalid/used/expired
    CodeValidation --> ValidCode : code valid and unused
    InvalidCode --> MTurkValidation
    ValidCode --> MarkCodeUsed
    MarkCodeUsed --> StudyComplete
    
    %% Error Recovery States
    ConsentUploadError --> CORSError : CORS failure
    DemographicsUploadError --> CORSError : CORS failure
    TaskUploadError --> CORSError : CORS failure
    CompletionUploadError --> CORSError : CORS failure
    
    CORSError --> EnvironmentDetection : retry with different endpoint
    
    %% Final States
    StudyComplete --> [*]
```

### 🔍 [Interactive State Diagram](./state-diagram-visual.html)
View the complete system flow with zoom, export capabilities, and detailed state descriptions.

### ⏱️ [Interactive Sequence Diagrams](./sequence-diagram-interactive.html)
Explore temporal interactions with 5 detailed sequence views: Complete Journey, Error Handling, Environment Routing, Keystroke Collection, and Survey Code Lifecycle.

## 📁 Project Structure

```
web-data-collection/
├── 📄 state-diagram-visual.html      # Interactive system visualization
├── 📄 STATE_DIAGRAM.md               # Complete state documentation
├── 📄 VISUAL_EXPORTS.md              # Export guide for diagrams
├── 🏗️  netlify/functions/             # Serverless backend
│   ├── data-handler.js               # Consolidated API handler
│   └── utils/supabase-utils.js       # Database utilities
├── 📱 pages/hosting/                  # Study flow pages
│   ├── consent.html                  # IRB consent form
│   ├── demographics.html             # Participant data collection
│   ├── tasks.html                    # Main task controller
│   └── complete.html                 # Completion & code generation
├── 🎮 pages/fake_pages/              # Social media clones
│   ├── Facebook-Clone/               # Facebook interface
│   ├── instagram-clone/              # Instagram interface
│   └── twitter-clone/                # Twitter interface
├── ⚙️  utils/                         # Shared utilities
│   └── common.js                     # Core functions & API handling
└── 🎨 styles/                        # Global styling
    └── global.css                    # Consistent UI theme
```
## Credits

[The original Facebook clone](https://github.com/KashanAdnan/Facebook-Clone)

[The original Instagram clone](https://github.com/leocosta1/instagram-clone)

## Participate
>  ⚠️ **_NOTE:_**  To avoid any potential issues with browser caching and cookie retention, it is recommended to use a fresh private browser instance

Click [here](https://fakeprofiledetection.github.io/web-data-collection/pages/hosting/consent.html) to participate in data collection
