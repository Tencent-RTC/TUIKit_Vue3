import { MessageType } from '@atomicxcore/core';
import type { MessageInfo } from '@atomicxcore/core';

const TYPING_BUSINESS_ID = 'user_typing_status';
const TYPING_STATUS_START = 1;
const TYPING_STATUS_END = 0;
const TYPING_ACTION_START_ID = 14;
const TYPING_ACTION_END_ID = 0;
const TYPING_ACTION_START = 'EIMAMSG_InputStatus_Ing';
const TYPING_ACTION_END = 'EIMAMSG_InputStatus_End';
const TYPING_VERSION = 1;

function parseCustomData(raw: unknown): Record<string, unknown> | undefined {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return typeof data === 'object' && data !== null ? data as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function createTypingCustomData(isTyping: boolean): string {
  return JSON.stringify({
    businessID: TYPING_BUSINESS_ID,
    typingStatus: isTyping ? TYPING_STATUS_START : TYPING_STATUS_END,
    version: TYPING_VERSION,
    userAction: isTyping ? TYPING_ACTION_START_ID : TYPING_ACTION_END_ID,
    actionParam: isTyping ? TYPING_ACTION_START : TYPING_ACTION_END,
  });
}

function getTypingPayload(message: MessageInfo): Record<string, unknown> | undefined {
  if (message.messageType !== MessageType.Custom) {
    return undefined;
  }
  const payload = parseCustomData(message.messagePayload?.customData);
  return payload?.businessID === TYPING_BUSINESS_ID ? payload : undefined;
}

function isTypingMessage(message: MessageInfo): boolean {
  return getTypingPayload(message) !== undefined;
}

function isTypingStartMessage(message: MessageInfo): boolean {
  const payload = getTypingPayload(message);
  return payload?.typingStatus === TYPING_STATUS_START || payload?.userAction === TYPING_ACTION_START_ID;
}

function isTypingEndMessage(message: MessageInfo): boolean {
  const payload = getTypingPayload(message);
  return payload?.typingStatus === TYPING_STATUS_END || payload?.userAction === TYPING_ACTION_END_ID;
}

export {
  TYPING_BUSINESS_ID,
  TYPING_STATUS_START,
  TYPING_STATUS_END,
  TYPING_ACTION_START_ID,
  TYPING_ACTION_END_ID,
  createTypingCustomData,
  isTypingMessage,
  isTypingStartMessage,
  isTypingEndMessage,
};
