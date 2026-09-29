import { getGraphQLUrl } from '../config';
import { getStoredToken } from './api';
import { Conversation, Message, User, CallRecord, CallType, CallStatus, MessageType } from '../types';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: any }>;
}

export const executeGraphQL = async <T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> => {
  const url = getGraphQLUrl();
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL Network error: ${res.status} ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map((e) => e.message).join(', ');
    throw new Error(msg);
  }

  if (!json.data) {
    throw new Error('No data received from GraphQL server');
  }

  return json.data;
};

// ----------------- Queries -----------------

export const fetchCurrentUser = async (): Promise<User> => {
  const query = `
    query GetCurrentUser {
      GetCurrentUser {
        id
        username
        email
        displayName
        avatar
        bio
        gender
        statusMessage
        isOnline
        lastSeen
        createdAt
        updatedAt
      }
    }
  `;
  const data = await executeGraphQL<{ GetCurrentUser: User }>(query);
  return data.GetCurrentUser;
};

export const fetchSearchUsers = async (queryStr: string = ''): Promise<User[]> => {
  const query = `
    query SearchUsers($query: String) {
      SearchUsers(query: $query) {
        id
        username
        email
        displayName
        avatar
        bio
        gender
        statusMessage
        isOnline
        lastSeen
      }
    }
  `;
  const data = await executeGraphQL<{ SearchUsers: User[] }>(query, { query: queryStr });
  return data.SearchUsers;
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  const query = `
    query GetConversations {
      GetConversations {
        id
        participants {
          id
          username
          displayName
          avatar
          bio
          gender
          statusMessage
          isOnline
          lastSeen
        }
        lastMessage {
          id
          conversationId
          content
          type
          status
          createdAt
          sender {
            id
            username
            displayName
            avatar
          }
        }
        unreadCounts {
          userId
          count
        }
        createdAt
        updatedAt
      }
    }
  `;
  const data = await executeGraphQL<{ GetConversations: Conversation[] }>(query);
  return data.GetConversations;
};

export const fetchConversation = async (conversationId: string): Promise<Conversation> => {
  const query = `
    query GetConversation($conversationId: ID!) {
      GetConversation(conversationId: $conversationId) {
        id
        participants {
          id
          username
          displayName
          avatar
          bio
          gender
          statusMessage
          isOnline
          lastSeen
        }
        unreadCounts {
          userId
          count
        }
        createdAt
        updatedAt
      }
    }
  `;
  const data = await executeGraphQL<{ GetConversation: Conversation }>(query, {
    conversationId,
  });
  return data.GetConversation;
};

export const fetchMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  const query = `
    query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
      GetMessages(conversationId: $conversationId, limit: $limit, offset: $offset) {
        id
        conversationId
        content
        type
        status
        readBy
        createdAt
        sender {
          id
          username
          displayName
          avatar
        }
      }
    }
  `;
  const data = await executeGraphQL<{ GetMessages: Message[] }>(query, {
    conversationId,
    limit,
    offset,
  });
  return data.GetMessages;
};

export const fetchCallHistory = async (): Promise<CallRecord[]> => {
  const query = `
    query GetCallHistory {
      GetCallHistory {
        id
        caller {
          id
          username
          displayName
          avatar
        }
        receiver {
          id
          username
          displayName
          avatar
        }
        conversationId
        callType
        status
        startedAt
        endedAt
        duration
        createdAt
      }
    }
  `;
  const data = await executeGraphQL<{ GetCallHistory: CallRecord[] }>(query);
  return data.GetCallHistory;
};

// ----------------- Mutations -----------------

export const mutateSendMessage = async (
  conversationId: string,
  content: string,
  type: MessageType = 'text'
): Promise<Message> => {
  const query = `
    mutation SendMessage($conversationId: ID!, $content: String!, $type: MessageType) {
      SendMessage(conversationId: $conversationId, content: $content, type: $type) {
        id
        conversationId
        content
        type
        status
        readBy
        createdAt
        sender {
          id
          username
          displayName
          avatar
        }
      }
    }
  `;
  const data = await executeGraphQL<{ SendMessage: Message }>(query, {
    conversationId,
    content,
    type,
  });
  return data.SendMessage;
};

export const mutateCreateConversation = async (
  participantId: string
): Promise<Conversation> => {
  const query = `
    mutation CreateConversation($participantId: ID!) {
      CreateConversation(participantId: $participantId) {
        id
        participants {
          id
          username
          displayName
          avatar
          bio
          gender
          statusMessage
          isOnline
          lastSeen
        }
        unreadCounts {
          userId
          count
        }
        createdAt
        updatedAt
      }
    }
  `;
  const data = await executeGraphQL<{ CreateConversation: Conversation }>(query, {
    participantId,
  });
  return data.CreateConversation;
};

export const mutateMarkMessageAsRead = async (messageId: string): Promise<Message> => {
  const query = `
    mutation MarkMessageAsRead($messageId: ID!) {
      MarkMessageAsRead(messageId: $messageId) {
        id
        conversationId
        status
        readBy
      }
    }
  `;
  const data = await executeGraphQL<{ MarkMessageAsRead: Message }>(query, {
    messageId,
  });
  return data.MarkMessageAsRead;
};

export const mutateUpdateProfile = async (input: {
  displayName?: string;
  bio?: string;
  avatar?: string;
  gender?: string;
  statusMessage?: string;
}): Promise<User> => {
  const query = `
    mutation UpdateProfile($input: UpdateProfileInput!) {
      UpdateProfile(input: $input) {
        id
        username
        email
        displayName
        avatar
        bio
        gender
        statusMessage
        isOnline
        lastSeen
        updatedAt
      }
    }
  `;
  const data = await executeGraphQL<{ UpdateProfile: User }>(query, { input });
  return data.UpdateProfile;
};

export const mutateCreateCallRecord = async (input: {
  receiverId: string;
  callType: CallType;
  conversationId?: string;
}): Promise<CallRecord> => {
  const query = `
    mutation CreateCallRecord($input: CreateCallInput!) {
      CreateCallRecord(input: $input) {
        id
        caller {
          id
          displayName
          avatar
        }
        receiver {
          id
          displayName
          avatar
        }
        callType
        status
        startedAt
      }
    }
  `;
  const data = await executeGraphQL<{ CreateCallRecord: CallRecord }>(query, { input });
  return data.CreateCallRecord;
};

export const mutateUpdateCallStatus = async (
  callId: string,
  status: CallStatus,
  duration?: number
): Promise<CallRecord> => {
  const query = `
    mutation UpdateCallStatus($callId: ID!, $status: CallStatus!, $duration: Int) {
      UpdateCallStatus(callId: $callId, status: $status, duration: $duration) {
        id
        status
        duration
        endedAt
      }
    }
  `;
  const data = await executeGraphQL<{ UpdateCallStatus: CallRecord }>(query, {
    callId,
    status,
    duration,
  });
  return data.UpdateCallStatus;
};
