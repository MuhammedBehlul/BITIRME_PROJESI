import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({
  pendingRequestCount: 0,
  unreadMessagesCount: 0,
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();

    // Pending request query: kullanıcıya gelen bekleyen sohbet istekleri
    const requestsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('requestStatus', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      setPendingRequestCount(snapshot.size);
    });

    // Unread messages count: tüm chatlerdeki unreadCounts içinden kullanıcıya ait toplam unread sayısı
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.unreadCounts && data.unreadCounts[user.uid]) {
          totalUnread += data.unreadCounts[user.uid];
        }
      });
      setUnreadMessagesCount(totalUnread);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeChats();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ pendingRequestCount, unreadMessagesCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
