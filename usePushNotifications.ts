import { useState, useEffect, useRef } from "react"

import * as Device from "expo-device"
import * as Notifications from "expo-notifications"

import Constants from "expo-constants"

import { Platform, PushNotification } from "react-native"

export interface PushNotificationsState {
    notification?: Notifications.Notification
    expoPushToken?: Notifications.ExpoPushToken
}

export const usePushNotifications = (): PushNotificationsState => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: false,
            shouldShowAlert: true,
            shouldSetBadge: false,
        })
    })

    const [expoPushToken, setExpoPushToken] = useState<
        Notifications.ExpoPushToken | undefined
    >()

    const [notification, setNotification] = useState<
        Notifications.Notification | undefined
    >()

    const notificationListener = useRef<Notifications.Subscription>(null)
    const responseListener = useRef<Notifications.Subscription>(null)

    async function registerForPushNotificationsAsync() {
        let token = undefined

        if (Device.isDevice) {
            const {status: existingStatus} = await Notifications.getPermissionsAsync()

            let finalStatus = existingStatus

            if (existingStatus !== "granted") {
                const {status} = await Notifications.requestPermissionsAsync()
                finalStatus = status
            }
            if (finalStatus !== "granted") {
                alert("Falha ao recuperar o token para enviar notificações")
            }

            token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            })
            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                })
            }

            return token
        } else {
            console.log("ERRO: Por favor, use um dispositivo físico!")
        }
    }

    useEffect(() => {
        // @ts-ignore
        registerForPushNotificationsAsync()
            .then(token => setExpoPushToken(token))
            .catch((error: any) => setExpoPushToken(error))

        notificationListener.current =
            Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification)
        });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response)
        });

        return () => {
            notificationListener.current &&
            Notifications.removeNotificationSubscription(notificationListener.current!)
            responseListener.current &&
            Notifications.removeNotificationSubscription(responseListener.current!)
        };
    }, []);

    return {
        expoPushToken,
        notification,
    }
}
