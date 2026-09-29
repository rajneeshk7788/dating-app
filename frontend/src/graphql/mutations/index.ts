import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql`
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

export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($participantId: ID!) {
    CreateConversation(participantId: $participantId) {
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
      unreadCounts {
        userId
        count
      }
      createdAt
      updatedAt
    }
  }
`;

export const SEND_MESSAGE = gql`
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

export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($messageId: ID!) {
    MarkMessageAsRead(messageId: $messageId) {
      id
      conversationId
      status
      readBy
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: ID!) {
    DeleteMessage(messageId: $messageId)
  }
`;

export const CREATE_CALL_RECORD = gql`
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

export const UPDATE_CALL_STATUS = gql`
  mutation UpdateCallStatus($callId: ID!, $status: CallStatus!, $duration: Int) {
    UpdateCallStatus(callId: $callId, status: $status, duration: $duration) {
      id
      status
      duration
      endedAt
    }
  }
`;
