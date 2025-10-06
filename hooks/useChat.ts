"use client";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "@/context/socketContext";
import { AppDispatch, RootState } from "@/libs/redux/store";
import {
  addMessage,
  incrementUnreadCount,
  addChat,
  setChats,
  setMessages,
  updateChat,
  removeChat,
  updateMessage,
  removeMessage,
  markMessageAsRead,
  addPinnedMessage,
  removePinnedMessage,
  addStarredMessage,
  removeStarredMessage,
  setActiveChat,
} from "@/libs/redux/chatSlice";
import { useFetch, useMutate } from "@/hooks/useFetch";
import { api } from "@/libs/axios/config";
import { errorMessageHandler } from "@/libs/feedback/error-handler";
import { AxiosProgressEvent } from "axios";
import { Chat, Message } from "@/types";
import toast from "react-hot-toast";
interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}
export const useChat = () => {
  const dispatch: AppDispatch = useDispatch();
  const { socket, isConnected } = useSocket();
  const { activeChat, messages, chats } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: conversations, isLoading } = useFetch("/chat/conversations");
  const [socketInitialized, setSocketInitialized] = useState(false);
  const connectionAttempted = useRef(false); 
  const isSocketReady = () => {
    return socket && socket.connected && isConnected && user?._id;
  };
  useEffect(() => {
    if (
      socket &&
      isConnected &&
      user?._id &&
      !socketInitialized &&
      !connectionAttempted.current
    ) {
      console.log("Socket connected, initializing...");
      connectionAttempted.current = true;
      const initTimer = setTimeout(() => {
        console.log("Emitting new_connection event...");
        socket.emit("new_connection");
        setSocketInitialized(true);
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, [socket, isConnected, user?._id, socketInitialized]);
  useEffect(() => {
    console.log("useChat - Connection Status:", {
      hasSocket: !!socket,
      isConnected,
      socketInitialized,
      userId: user?._id,
      isReady: isSocketReady(),
      connectionAttempted: connectionAttempted.current,
    });
  }, [socket, isConnected, socketInitialized, user?._id]);
  const createChatMutation = useMutate("POST", "/chat/conversations", {
    onSuccess: (conversation: any) => {
      const transformedChat: Chat = {
        _id: conversation._id,
        name:
          conversation.type === "direct"
            ? conversation.participants.find((p: any) => p._id !== user?._id)
                ?.username || "Unknown User"
            : conversation.name || "Group Chat",
        type: conversation.type,
        participants: conversation.participants.map((p: any) => ({
          _id: p._id,
          username: p.username,
          avatar: p.avatar,
        })),
        lastMessage: conversation.lastMessage
          ? {
              _id: conversation.lastMessage._id,
              conversationId: conversation._id,
              senderId: conversation.lastMessage.senderId,
              content: conversation.lastMessage.content,
              messageType: conversation.lastMessage.messageType || "text",
              edited: conversation.lastMessage.edited,
              editedAt: conversation.lastMessage.editedAt,
              reactions: conversation.lastMessage.reactions || [],
              createdAt: conversation.lastMessage.createdAt,
              updatedAt: conversation.lastMessage.updatedAt,
              fileUrl: conversation.lastMessage.fileUrl,
              readBy: conversation.lastMessage.readBy,
              fileName: conversation.lastMessage.fileName,
              replyTo: conversation.lastMessage.replyTo,
              postId: conversation.lastMessage.postId,
            }
          : undefined,
        lastMessageTime: conversation.lastMessage?.createdAt,
        unreadCount: 0,
        avatar:
          conversation.avatar ||
          conversation.participants.find((p: any) => p._id !== user?._id)
            ?.avatar,
        isPinned: conversation.isPinned,
        isMuted: conversation.isMuted,
        isArchived: conversation.isArchived,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        pinnedMessages: conversation.pinnedMessages || [],
      };
      dispatch(addChat(transformedChat));
      dispatch(setActiveChat(transformedChat._id));
    },
    onError: (error: any) => {
      console.error("Error creating chat:", error);
      errorMessageHandler(error);
    },
  });
  const updateChatMutation = useMutate(
    "PUT",
    "/chat/conversations/:conversationId",
    {
      onSuccess: (conversation: any) => {
        const transformedChat: Chat = {
          _id: conversation._id,
          name: conversation.name || "Group Chat",
          type: conversation.type,
          participants: conversation.participants.map((p: any) => ({
            _id: p._id,
            username: p.username,
            avatar: p.avatar,
          })),
          lastMessage: conversation.lastMessage
            ? {
                _id: conversation.lastMessage._id,
                conversationId: conversation._id,
                senderId: conversation.lastMessage.senderId,
                content: conversation.lastMessage.content,
                messageType: conversation.lastMessage.messageType || "text",
                edited: conversation.lastMessage.edited,
                editedAt: conversation.lastMessage.editedAt,
                reactions: conversation.lastMessage.reactions || [],
                createdAt: conversation.lastMessage.createdAt,
                updatedAt: conversation.lastMessage.updatedAt,
                fileUrl: conversation.lastMessage.fileUrl,
                fileName: conversation.lastMessage.fileName,
                replyTo: conversation.lastMessage.replyTo,
                readBy: conversation.readBy,
                postId: conversation.lastMessage.postId,
              }
            : undefined,
          lastMessageTime: conversation.lastMessage?.createdAt,
          unreadCount: 0,
          avatar: conversation.avatar,
          isPinned: conversation.isPinned,
          isMuted: conversation.isMuted,
          isArchived: conversation.isArchived,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          pinnedMessages: conversation.pinnedMessages || [],
        };
        dispatch(updateChat(transformedChat));
      },
      onError: (error: any) => {
        console.error("Error updating chat:", error);
        errorMessageHandler(error);
      },
    }
  );
  const deleteChatMutation = useMutate(
    "DELETE",
    "/chat/conversations/:conversationId",
    {
      onSuccess: () => {
        console.log("Chat deleted successfully");
      },
      onError: (error: any) => {
        console.error("Error deleting chat:", error);
        errorMessageHandler(error);
      },
    }
  );
  const sendMessageMutation = useMutate(
    "POST",
    "/chat/conversations/:conversationId/messages",
    {
      onSuccess: (data: any) => {
        console.log("Message sent via HTTP:", data);
      },
      onError: (error: any) => {
        console.error("Error sending message:", error);
        errorMessageHandler(error);
        throw error;
      },
    }
  );
  const uploadFileMutation = useMutate("POST", "/files/upload", {
    onSuccess: (data: { fileUrl: string; fileName: string }) => {
      console.log("File uploaded:", data);
    },
    onError: (error: any) => {
      console.error("Error uploading file:", error);
      errorMessageHandler(error);
    },
  });
  useEffect(() => {
    if (conversations) {
      const transformedChats: Chat[] = conversations?.map((conv: any) => ({
        _id: conv._id,
        name:
          conv.type === "direct"
            ? conv.participants.find((p: any) => p._id !== user?._id)
                ?.username || "Unknown User"
            : conv.name || "Group Chat",
        type: conv.type,
        participants: conv.participants.map((p: any) => ({
          _id: p._id,
          username: p.username,
          avatar: p.avatar,
        })),
        lastMessage: conv.lastMessage
          ? {
              _id: conv.lastMessage._id,
              conversationId: conv._id,
              senderId: conv.lastMessage.senderId,
              content: conv.lastMessage.content,
              messageType: conv.lastMessage.messageType || "text",
              readBy: conv.lastMessage.readBy,
              edited: conv.lastMessage.edited,
              editedAt: conv.lastMessage.editedAt,
              reactions: conv.lastMessage.reactions || [],
              createdAt: conv.lastMessage.createdAt,
              updatedAt: conv.lastMessage.updatedAt,
              fileUrl: conv.lastMessage.fileUrl,
              fileName: conv.lastMessage.fileName,
              replyTo: conv.lastMessage.replyTo,
              postId: conv.lastMessage.postId,
            }
          : undefined,
        lastMessageTime: conv.lastMessage?.createdAt,
        unreadCount: 0,
        avatar:
          conv.avatar ||
          conv.participants.find((p: any) => p._id !== user?._id)?.avatar,
        isPinned: conv.isPinned,
        isMuted: conv.isMuted,
        isArchived: conv.isArchived,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        pinnedMessages: conv.pinnedMessages || [],
      }));
      dispatch(setChats(transformedChats));
    }
  }, [conversations, dispatch, user?._id]);
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (response: any) => {
      const message = response.message || response;
      const transformedMessage: Message = {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType || "text",
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        replyTo: message.replyTo,
        readBy: message.readBy,
        edited: message.edited,
        editedAt: message.editedAt,
        reactions: message.reactions || [],
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        postId: message.postId,
        callStatus: message?.callStatus,
      };
      dispatch(addMessage(transformedMessage));
      if (message.conversationId !== activeChat) {
        dispatch(incrementUnreadCount(message.conversationId));
      }
    };
    socket.on("new_message", handleNewMessage);
    socket.on("message_edited", (response: any) => {
      const message = response.message || response;
      dispatch(
        updateMessage({
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType || "text",
          fileUrl: message.fileUrl,
          fileName: message.fileName,
         readBy: message.readBy,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions || [],
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          replyTo: message.replyTo,
          postId: message.postId,
        })
      );
    });
    socket.on("message_deleted", (data: { messageId: string }) => {
      dispatch(removeMessage(data.messageId));
    });
    socket.on("reaction_added", (response: any) => {
      const message = response.message || response;
      dispatch(
        updateMessage({
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType || "text",
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          readBy: message.readBy,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions || [],
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          replyTo: message.replyTo,
          postId: message.postId,
        })
      );
    });
    socket.on("reaction_removed", (response: any) => {
      const message = response.message || response;
      dispatch(
        updateMessage({
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType || "text",
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          readBy: message.readBy,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions || [],
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          replyTo: message.replyTo,
          postId: message.postId,
        })
      );
    });
    socket.on(
      "messages_read",
      (data: { conversationId: string; userId: { username: string, _id: string, avatar?: string} }) => {
        dispatch(markMessageAsRead({conversationId: data.conversationId, userId: data.userId}));
      }
    );
    socket.on(
      "message_pinned",
      (data: { conversationId: string; messageId: string }) => {
        const message = messages[data.conversationId]?.find(
          (m: Message) => m._id === data.messageId
        );
        if (message) {
          dispatch(addPinnedMessage({ chatId: data.conversationId, message }));
        }
      }
    );
    socket.on(
      "message_unpinned",
      (data: { conversationId: string; messageId: string }) => {
        dispatch(
          removePinnedMessage({
            chatId: data.conversationId,
            messageId: data.messageId,
          })
        );
      }
    );
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("reaction_added");
      socket.off("reaction_removed");
      socket.off("messages_read");
      socket.off("message_pinned");
      socket.off("message_unpinned");
    };
  }, [socket, dispatch, activeChat, user?._id, messages]);
  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType:
      | "text"
      | "image"
      | "file"
      | "audio"
      | "video"
      | "post" = "text",
    fileUrl?: string,
    fileName?: string,
    replyTo?: string,
    postId?: string
  ) => {
    if (!user?._id) return;
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}-${Math.random()}`,
      conversationId,
      senderId: {
        _id: user._id,
        username: user.username || "Unknown",
        avatar: user.avatar,
      },
      content,
      messageType,
      fileUrl,
      fileName,
      replyTo: replyTo
        ? { _id: replyTo, content: "", senderId: "", messageType: "text" }
        : undefined,
      readBy: [],
      edited: false,
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postId,
    };
    dispatch(addMessage(optimisticMessage));
    if (socket && isSocketReady()) {
      try {
        console.log("🔌 Attempting to send via socket...");
        const socketResult = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Socket timeout"));
          }, 2000);
          const messageHandler = (data: any) => {
            clearTimeout(timeout);
            socket.off("message_sent", messageHandler);
            socket.off("message_error", errorHandler);
            resolve(data);
          };
          const errorHandler = (error: any) => {
            clearTimeout(timeout);
            socket.off("message_sent", messageHandler);
            socket.off("message_error", errorHandler);
            reject(error);
          };
          socket.on("message_sent", messageHandler);
          socket.on("message_error", errorHandler);
          socket.emit("send_message", {
            conversationId,
            content,
            messageType,
            fileUrl,
            fileName,
            replyTo,
            postId,
          });
        });
        console.log("✅ Message sent successfully via socket");
        dispatch(removeMessage(optimisticMessage._id));
        return socketResult;
      } catch (socketError: any) {
        console.log(
          "❌ Socket sending failed, falling back to HTTP:",
          socketError.message
        );
      }
    }
    try {
      console.log("🌐 Sending message via HTTP API...");
      const response = await api.post(
        `/chat/conversations/${conversationId}/messages`,
        {
          content,
          messageType,
          fileUrl,
          fileName,
          replyTo,
          postId,
        }
      );
      const messageData = response.data.message || response;
      dispatch(removeMessage(optimisticMessage._id));
      dispatch(
        addMessage({
          _id: messageData._id,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          content: messageData.content,
          messageType: messageData.messageType || "text",
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          readBy: messageData.readBy ?? [],
          edited: messageData.edited,
          editedAt: messageData.editedAt,
          reactions: messageData.reactions || [],
          createdAt: messageData.createdAt,
          updatedAt: messageData.updatedAt,
          replyTo: messageData.replyTo,
          postId: messageData.postId,
        })
      );
      return response;
    } catch (error: any) {
      dispatch(removeMessage(optimisticMessage._id));
      errorMessageHandler(error);
      throw error;
    }
  };
  const createChat = async (
    participantIds: string[],
    type: "direct" | "group" = "direct",
    name?: string,
    avatar?: string
  ) => {
    createChatMutation.mutate({ participantIds, type, name, avatar });
    return createChatMutation;
  };
  const updateChatFn = async (
    conversationId: string,
    data: {
      name?: string;
      participants?: string[];
      description?: string;
      avatar?: string;
    }
  ) => {
    updateChatMutation.mutate({ ...data, conversationId });
    return updateChatMutation;
  };
  const deleteChat = async (conversationId: string) => {
    deleteChatMutation.mutate({ conversationId });
    dispatch(removeChat(conversationId));
    return deleteChatMutation;
  };
  const loadMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${chatId}/messages`);
      const messages = response.data;
      const transformedMessages: Message[] = messages.map((msg: any) => ({
        _id: msg._id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        messageType: msg.messageType || "text",
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        readBy: msg.readBy,
        edited: msg.edited,
        editedAt: msg.editedAt,
        reactions: msg.reactions || [],
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        replyTo: msg.replyTo,
        postId: msg.postId,
      }));
      dispatch(setMessages({ chatId, messages: transformedMessages }));
      return transformedMessages;
    } catch (error: any) {
      errorMessageHandler(error);
      throw error;
    }
  };
  const editMessage = async (messageId: string, content: string) => {
    if (socket && isSocketReady()) {
      console.log("🔌 Editing message via socket...");
      socket.emit("edit_message", { messageId, content });
    } else {
      console.log(
        "🌐 Socket not ready, implementing HTTP fallback for edit message"
      );
      try {
        const response = await api.put(`/chat/messages/${messageId}`, {
          content,
        });
        const messageData = response.data;
        dispatch(
          updateMessage({
            _id: messageData._id,
            conversationId: messageData.conversationId,
            senderId: messageData.senderId,
            content: messageData.content,
            messageType: messageData.messageType || "text",
            fileUrl: messageData.fileUrl,
            fileName: messageData.fileName,
            readBy: messageData.readBy,
            edited: messageData.edited,
            editedAt: messageData.editedAt,
            reactions: messageData.reactions || [],
            createdAt: messageData.createdAt,
            updatedAt: messageData.updatedAt,
            replyTo: messageData.replyTo,
            postId: messageData.postId,
          })
        );
      } catch (error: any) {
        console.error("❌ Failed to edit message via HTTP:", error);
        errorMessageHandler(error);
      }
    }
  };
  const deleteMessage = async (messageId: string) => {
    if (socket && isSocketReady()) {
      console.log("🔌 Deleting message via socket...");
      socket.emit("delete_message", { messageId });
    } else {
      console.log(
        "🌐 Socket not ready, implementing HTTP fallback for delete message"
      );
      try {
       const response = await api.delete(`/chat/messages/${messageId}`);
        if (response.status === 200) {
                  toast.success("Message deleted successfully");
        }
        dispatch(removeMessage(messageId));
      } catch (error: any) {
        console.error("Failed to delete message via HTTP:", error);
        errorMessageHandler(error);
      }
    }
  };
  const addReaction = async (messageId: string, emoji: string, name: string) => {
    console.log("Add reaction called", {
      socketExists: !!socket,
      isConnected: socket?.connected,
    });
    if (socket && isSocketReady()) {
      console.log("🔌 Adding reaction via socket...");
      socket.emit("add_reaction", { messageId, emoji, name });
    } else {
      console.log(
        "Socket not ready, implementing HTTP fallback for add reaction"
      );
      try {
        const response = await api.post(
          `/chat/messages/${messageId}/reactions`,
          { emoji, name }
        );
        const messageData = response.data;
        dispatch(
          updateMessage({
            _id: messageData._id,
            conversationId: messageData.conversationId,
            senderId: messageData.senderId,
            content: messageData.content,
            messageType: messageData.messageType || "text",
            fileUrl: messageData.fileUrl,
            fileName: messageData.fileName,
            readBy: messageData.readBy,
            edited: messageData.edited,
            editedAt: messageData.editedAt,
            reactions: messageData.reactions || [],
            createdAt: messageData.createdAt,
            updatedAt: messageData.updatedAt,
            replyTo: messageData.replyTo,
            postId: messageData.postId,
          })
        );
      } catch (error: any) {
        console.error("Failed to add reaction via HTTP:", error);
        errorMessageHandler(error);
      }
    }
  };
  const removeReaction = async (messageId: string) => {
    if (socket && isSocketReady()) {
      console.log("Removing reaction via socket...");
      socket.emit("remove_reaction", { messageId });
    } else {
      console.log(
        "🌐 Socket not ready, implementing HTTP fallback for remove reaction"
      );
      try {
        const response = await api.delete(
          `/chat/messages/${messageId}/reactions`
        );
        const messageData = response.data;
        dispatch(
          updateMessage({
            _id: messageData._id,
            conversationId: messageData.conversationId,
            senderId: messageData.senderId,
            content: messageData.content,
            messageType: messageData.messageType || "text",
            fileUrl: messageData.fileUrl,
            fileName: messageData.fileName,
            readBy: messageData.readBy,
            edited: messageData.edited,
            editedAt: messageData.editedAt,
            reactions: messageData.reactions || [],
            createdAt: messageData.createdAt,
            updatedAt: messageData.updatedAt,
            replyTo: messageData.replyTo,
            postId: messageData.postId,
          })
        );
      } catch (error: any) {
        console.error("❌ Failed to remove reaction via HTTP:", error);
        errorMessageHandler(error);
      }
    }
  };
  const pinMessage = async (conversationId: string, messageId: string) => {
    try {
      const response = await api.post(
        `/chat/conversations/${conversationId}/messages/${messageId}/pin`
      );
      const message = messages[conversationId]?.find(
        (m: Message) => m._id === messageId
      );
      if (response.status === 200) {
        toast.success("Message");
      }
      if (message) {
        dispatch(addPinnedMessage({ chatId: conversationId, message }));
      }
    } catch (error: any) {
      console.error("❌ Failed to pin message:", error);
      errorMessageHandler(error);
    }
  };
  const unpinMessage = async (conversationId: string, messageId: string) => {
    try {
     const response = await api.post(
        `/chat/conversations/${conversationId}/messages/${messageId}/unpin`
      );
      if (response.status === 200) {
                  toast.success("Message unpinned");
      }
      dispatch(removePinnedMessage({ chatId: conversationId, messageId }));
    } catch (error: any) {
      console.error("❌ Failed to unpin message:", error);
      errorMessageHandler(error);
    }
  };
  const forwardMessage = async (
    messageId: string,
    targetConversationId: string
  ) => {
    try {
      const response = await api.post(`/chat/messages/${messageId}/forward`, {
        targetConversationId,
      });
      const forwardedMessage = response.data.forwardedMessage;
      if (response.status === 201) {
        toast.success("Message forwarded successfully");
      }
      dispatch(addMessage(forwardedMessage));
    } catch (error: any) {
      console.error("❌ Failed to forward message:", error);
      errorMessageHandler(error);
    }
  };
  const starMessage = async (messageId: string) => {
    try {
     const response = await api.post(`/chat/messages/${messageId}/star`);
     if (response.status === 200) {
                toast.success("Message starred");
     }
      const message = Object.values(messages)
        .flat()
        .find((m: Message) => m._id === messageId);
      if (message) {
        dispatch(addStarredMessage(message));
      }
    } catch (error: any) {
      console.error("❌ Failed to star message:", error);
      errorMessageHandler(error);
    }
  };
  const unstarMessage = async (messageId: string) => {
    try {
     const response = await api.post(`/chat/messages/${messageId}/unstar`);
      if (response.status === 200) {
            toast.success("Message unstarred")
     }
      dispatch(removeStarredMessage(messageId));
    } catch (error: any) {
      console.error("❌ Failed to unstar message:", error);
      errorMessageHandler(error);
    }
  };
  const getMessageInfo = async (messageId: string) => {
    try {
      const response = await api.get(`/chat/messages/${messageId}/info`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to get message info:", error);
      errorMessageHandler(error);
      throw error;
    }
  };
  const markMessagesAsRead = async (chatId: string) => {
    console.log("markMessagesAsRead called", {
      socketExists: !!socket,
      isConnected: socket?.connected,
    });
    if (socket && isSocketReady()) {
      console.log("🔌 Marking messages as read via socket...");
      socket.emit("mark_read", { conversationId: chatId });
    }
    try {
      const res = await api.post(`/chat/conversations/${chatId}/read`);
      console.log("✅ Messages marked as read via HTTP");
      const read = res.data;
      dispatch(markMessageAsRead({conversationId: read.conversationId, userId: read.userId}));
    } catch (error) {
      console.error("❌ Failed to mark messages as read via HTTP:", error);
    }
  };
  const joinChat = (chatId: string) => {
    if (socket && isSocketReady()) {
      console.log("🔌 Joining chat via socket...", chatId);
      socket.emit("join_conversation", chatId);
    }
  };
  const leaveChat = (chatId: string) => {
    if (socket && isSocketReady()) {
      console.log("🔌 Leaving chat via socket...");
      socket.emit("leave_conversation", chatId);
    }
  };
  const startTyping = (chatId: string) => {
    if (socket && isSocketReady()) {
      socket.emit("typing", { conversationId: chatId });
    }
  };
  const stopTyping = (chatId: string) => {
    if (socket && isSocketReady()) {
      socket.emit("stop_typing", { conversationId: chatId });
    }
  };
  const uploadFile = async (formData: FormData, options?: UploadOptions) => {
    try {
      const response = await api.post("/chat/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: options?.onUploadProgress,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      errorMessageHandler(error);
      throw error;
    }
  };
  return {
    sendMessage,
    createChat,
    updateChat: updateChatFn,
    deleteChat,
    joinChat,
    leaveChat,
    loadMessages,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    forwardMessage,
    starMessage,
    unstarMessage,
    getMessageInfo,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    uploadFile,
    conversations: chats,
    isLoading,
    isCreatingChat: createChatMutation.isPending,
    createChatError: createChatMutation.error,
    isUpdatingChat: updateChatMutation.isPending,
    updateChatError: updateChatMutation.error,
    isDeletingChat: deleteChatMutation.isPending,
    deleteChatError: deleteChatMutation.error,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessageError: sendMessageMutation.error,
    isUploadingFile: uploadFileMutation.isPending,
    uploadFileError: uploadFileMutation.error,
    socketStatus: {
      hasSocket: !!socket,
      isConnected,
      socketInitialized,
      isReady: isSocketReady(),
    },
  };
};