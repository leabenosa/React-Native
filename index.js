/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import PushNotification from "react-native-push-notification";

PushNotification.createChannel(
  {
    channelId: "due-task-channel", // must match with scheduled channelId
    channelName: "Due Task Channel",
  },
  (created) => console.log(`createChannel returned '${created}'`)
);

AppRegistry.registerComponent(appName, () => App);
