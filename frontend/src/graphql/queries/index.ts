import { gql } from '@apollo/client';

export const GET_CURRENT_USER = gql`
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

export const SEARCH_USERS = gql`
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

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    GetUserProfile(userId: $userId) {
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
    }
  }
`;

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    GetConversations {
      id
      participants {
        id
        username
        displayName
        avatar
        bio
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

export const GET_CONVERSATION = gql`
  query GetConversation($conversationId: ID!) {
    GetConversation(conversationId: $conversationId) {
      id
      participants {
        id
        username
        displayName
        avatar
        bio
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

export const GET_MESSAGES = gql`
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

export const GET_CALL_HISTORY = gql`
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
      updatedAt
    }
  }
`;
