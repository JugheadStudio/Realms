![Realms Header Image](https://github.com/JugheadStudio/Github-assets/blob/main/Realms/Realms-header.png?raw=true)

- - - -

# About Realms

Realms is an adventure game platform where users can create and join interactive storytelling experiences. The app allows users to host their own adventures or join existing ones, with a built-in chat interface powered by OpenAI for real-time narration. Users can invite friends to their rooms and create custom characters, settings, and story themes.

### Built With
[![React](https://img.shields.io/badge/react-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Open AI](https://img.shields.io/badge/open%20AI-grey?style=for-the-badge&logo=openai)](https://openai.com/)
[![Google Cloud](https://img.shields.io/badge/google%20cloud%20TTS-yellow?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/)
[![Firebase](https://img.shields.io/badge/firebase-red?style=for-the-badge&logo=firebase)](https://react.dev/)
[![Javascript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://www.javascript.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://www.w3.org/html/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/Overview.en.html)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

![Realms Screenshot](https://github.com/JugheadStudio/Github-assets/blob/main/Realms/design1.png?raw=true)

![Realms Screenshot 2](https://github.com/JugheadStudio/Github-assets/blob/main/Realms/design2.png?raw=true)

## How To Install

1. To get started, clone the repo:

```
git clone https://github.com/JugheadStudio/Realms.git
```

2. Install node packages:
```
npm i
```

3. Create an Open AI account and get an API key

4. Create a Google Cloud account and get a Text-To-Speech API key

5. Create a .env.local file in your root directory and add the following into the file
```
OPENAI_API_KEY=your-key-here

NEXT_PUBLIC_FIREBASE_API_KEY=your-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-key-here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-key-here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-key-here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-key-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-key-here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-key-here

NEXT_PUBLIC_GOOGLE_API_KEY=your-key-here
```



## Features

| Feature            | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **Create Adventures**   | Users can create their own personalized adventure with unique settings and characters. |
| **Join Adventures**     | Players can join existing adventures and interact with others in real-time. |
| **Voice Narration**   | AI-powered voice narration for a more immersive experience, utilizing Google Cloud's Text-to-Speech. |
| **Multiplayer Support** | Users can invite friends to join their adventure rooms and engage in cooperative storytelling. |
| **Real-time Chat**      | Text-based communication between users and the AI for dynamic interaction. |
| **Room Customization**  | Room creators can customize the adventure environment, allowing for unique and varied gameplay. |
| **Authentication**      | Users can log in with Firebase to track their progress and save their adventures. |


## The Idea

Realms was created to offer a dynamic and interactive storytelling platform where users can immerse themselves in personalized adventures. By combining creative character creation, real-time AI-driven narration, and social features, it provides an engaging experience for users seeking to create and explore unique worlds.

## Development Process

### Highlights
One of the highlights of Realms is the seamless integration of OpenAI's API to generate dynamic and interactive storylines. The platform's user-friendly interface allows for easy adventure creation, while the real-time chat interface provides an engaging and immersive experience. The ability to invite friends to rooms and create custom settings adds to the flexibility and customization of the platform.

### Challenges
The most challenging part of development was ensuring smooth integration of the OpenAI API for real-time narration while also maintaining low latency. Additionally, building the infrastructure for hosting and managing user-created adventures required careful planning to ensure scalability and responsiveness.

## Future Implementations

* Enhanced character creation with deeper customization options
* Gamification elements, such as achievements and quests
* Mobile app version for on-the-go adventure creation
* Prebuilt adventures that players can just jump in and enjoy

## Demonstration
[Link to Demonstration Video](https://drive.google.com/file/d/1ktB2D5n4pv4Qz_5BEXyfNxWlEdT1EmB7/view?usp=sharing)

### License
[MIT](LICENSE) © [Jughead Studio](https://github.com/JugheadStudio)
