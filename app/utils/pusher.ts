// app/utils/pusher.ts
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

let pusherServer: Pusher | null = null;
let pusherClient: PusherClient | null = null;

if (typeof window === 'undefined') {
  // Código del lado del servidor
  if (
    process.env.PUSHER_APP_ID &&
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
    process.env.PUSHER_APP_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    try {
      pusherServer = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        useTLS: true,
      });
    } catch (error) {
      console.error('Error initializing Pusher server:', error);
    }
  } else {
    console.warn('Pusher server configuration is incomplete. Some features may not work.');
  }
} else {
  // Código del lado del cliente
  if (
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    try {
      pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
    } catch (error) {
      console.error('Error initializing Pusher client:', error);
    }
  } else {
    console.warn('Pusher client configuration is incomplete. Real-time updates may not work.');
  }
}

export { pusherServer, pusherClient };