import { useBarrageState, BarrageEvent, BarrageType, useLiveListState } from 'tuikit-atomicx-vue3';
import type { Barrage } from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import { session } from '../services/session/session';
import type { ExampleGroup, StateViewDef, StateTranslator } from '../lib/types';
import { ALL_ROLES } from '../lib/types';

/**
 * 6.7 useBarrageState —— Barrage (text messages + custom business messages).
 *
 * Covers messageList reads, text-barrage sending, custom business-message
 * sending, local system tips, and two event subscriptions
 * (onBarrageReceived / onCustomMessageReceived).
 *
 * Role convention: barrage is a lightweight in-room interaction for any member
 * — sending text, sending custom business messages, and appending local tips
 * are all open to every role, so host / audience / admin are all allowed. The
 * underlying RoomEngine rejects calls when not in a room; errors surface via
 * the Output red box + the event log.
 *
 * Design notes:
 * - **Text vs custom**: the contract repeatedly stresses "custom messages do
 *   NOT enter messageList". The two cards each demonstrate this boundary:
 *   after sendTextMessage you immediately see an echo in the state card's
 *   messageList; after sendCustomMessage the messageList length is unchanged
 *   and it only appears via onCustomMessageReceived in the EventLog.
 * - **appendLocalTip sends nothing to the server**: it is a pure local UX
 *   injection. The card description states "the other side cannot see it" to
 *   stop integrators mistaking it for another kind of "send message".
 * - **extensionInfo / businessId use JSON fields**: the defaults give a
 *   meaningful example (colored barrage, gift business) so integrators can
 *   copy the template directly.
 */
function useBarrageExamples(): ExampleGroup {
  const barrage = useBarrageState();
  const { currentLive } = useLiveListState();

  // Room gate: barrage operations require being in a live room.
  const roomGate = () => currentLive.value?.liveId ? '' : 'Card.NotInRoom';

  // Subscribe both barrage events into the shared log.
  const barrageEvents = useEventLogSubscription('live-barrage', barrage, BarrageEvent);
  // Toggleable demo-handler set for subscribeEvent / unsubscribeEvent cards.
  const demoToggle = useDemoHandlerToggle('live-barrage', barrage, BarrageEvent);

  /** Compact, serializable view of the barrage state. */
  const snapshot = () => {
    const list = barrage.messageList.value as Barrage[];
    return {
      messageCount: list.length,
      // Trim to last 5 so the Output panel stays readable; serializer in
      // ExampleCard pretty-prints this JSON.
      latest: list.slice(-5).map(m => ({
        sequence: m.sequence,
        sender: m.sender?.userName || m.sender?.userId,
        text: m.textContent,
        timestamp: m.timestampInSecond,
      })),
    };
  };

  /** Humanized inspector schema for the `live-barrage.state` snapshot. */
  const barrageView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Barrage',
        rows: [
          { key: 'messageCount', label: 'Total barrages', kind: 'count' },
          { key: 'latest', label: 'Latest 5', kind: 'list', preview: 5 },
        ],
      },
    ],
  };

  /**
   * Parse a JSON-textarea field tolerantly: empty / invalid input falls back
   * to `undefined` so we don't pass `null` into the SDK. Throws with a
   * pointed message when input is non-empty but unparsable — the Output panel
   * surfaces that as a red error.
   */
  const parseJsonField = (raw: unknown, fieldName: string, t: StateTranslator): Record<string, string> | undefined => {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(t('Error.BarrageNotJsonObject', { defaultValue: '{{fieldName}} must be a JSON object (key-value map)', fieldName }));
      }
      return parsed as Record<string, string>;
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(
        t('Error.BarrageJsonParseFailed', { defaultValue: '{{fieldName}} JSON parse failed: {{reason}}', fieldName, reason }),
      );
    }
  };

  return {
    state: 'live-barrage',
    hook: 'useBarrageState',
    title: 'Barrage',
    category: '6.8',
    source: 'BarrageState/BarrageState.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: no on/off switch exists;
    // send/receive only depends on being in a room.
    intro: {
      summary: 'Barrage has no on/off switch; whether you can send/receive depends only on being in a room',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'There is no barrage "on/off" switch in the source (startBarrage/stopBarrage do not exist); whether you can send/receive depends only on being in a room. Sending before joining is rejected by the underlying RoomEngine.',
            'The two message types use different channels: a text barrage auto-enters messageList and triggers onBarrageReceived; a custom message does NOT enter messageList and is only relayed via onCustomMessageReceived, so the business layer must parse `data` itself.',
            'Sending depends on the roomEngine instance existing (i.e. already in a room); calling before joining silently fails / throws.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'After sending a gift via sendCustomMessage the messageList length is unchanged — you MUST subscribe to onCustomMessageReceived to get it, otherwise it "looks like nothing was sent".',
            'appendLocalTip is a pure local push into messageList and sends nothing to the server; mistaking it for "another kind of send" means the other side never receives it.',
            'A custom message\'s `data` is a raw string; the SDK does not validate its format, so the business side must agree on a schema and JSON.parse it itself.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-barrage.state',
        api: 'state',
        title: 'Read barrage state (messageList)',
        description: 'messageList reactive: the in-room text-barrage queue.',
        notes: {
          summary: 'messageList · what it holds',
          groups: [
            {
              tone: 'must',
              items: [
                'It only holds "text barrages" (SDK-relayed + appendLocalTip local injection); custom business messages do NOT enter messageList — you must subscribe to onCustomMessageReceived to handle them.',
              ],
            },
          ],
        },
        signature: 'messageList: Ref<Barrage[]>',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...barrageEvents],
        // Humanized inspector schema (see `barrageView` above) replaces
        // the raw JSON dump for this card.
        stateView: barrageView,
        // Live snapshot via watchEffect; toasting on every tick is noise.
        successToast: false,
        run: () => snapshot(),
        snippet: `import { useBarrageState } from 'tuikit-atomicx-vue3';

const { messageList } = useBarrageState();
// messageList only contains messages of BarrageType.text.
`,
      },
      {
        id: 'live-barrage.sendTextMessage',
        api: 'sendTextMessage',
        title: 'Send text barrage',
        description: 'Send a text barrage to the current live room.',
        signature: 'sendTextMessage(options: { text: string; extensionInfo?: Record<string, string> }): Promise<void>',
        roles: ALL_ROLES,
        events: [...barrageEvents],
        disabled: roomGate,
        successToast: {
          title: 'Barrage sent',
          description: 'The receiver gets onBarrageReceived and it auto-enters messageList',
        },
        fields: [
          {
            key: 'text',
            label: 'text',
            type: 'text',
            default: 'Hello everyone, welcome to the live stream!',
            placeholder: 'Text content to send',
          },
          {
            key: 'extensionInfo',
            label: 'extensionInfo (JSON)',
            type: 'json',
            // String values are the contract — keep the JSON values as strings
            // so the operator can see the exact shape SDK expects.
            default: '{ "color": "#ff5722", "fontSize": "16px" }',
            help: 'Optional; must be a JSON object with string values. The SDK does not parse it, only relays it as-is.',
          },
        ],
        run: async ({ inputs, t }) => {
          const text = String(inputs.text || '');
          if (!text) {
            throw new Error(t('Error.BarrageTextEmpty', 'text cannot be empty'));
          }
          const extensionInfo = parseJsonField(inputs.extensionInfo, 'extensionInfo', t);
          await barrage.sendTextMessage({ text, extensionInfo });
          return { sent: true, text, extensionInfo };
        },
        snippet: `const { sendTextMessage } = useBarrageState();

await sendTextMessage({
  text: 'Hello everyone, welcome to the live stream!',
  extensionInfo: { color: '#ff5722', fontSize: '16px' },
});`,
      },
      {
        id: 'live-barrage.sendCustomMessage',
        api: 'sendCustomMessage',
        title: 'Send custom business message',
        description: 'Send a custom business message (gift / lucky bag / entrance notice, etc.).',
        notes: {
          summary: 'sendCustomMessage · difference from text barrage',
          groups: [
            {
              tone: 'must',
              items: [
                'Custom messages do NOT enter messageList: they are only relayed to the receiver via the onCustomMessageReceived event. The business side must subscribe to the event and parse `data` itself (usually a JSON string); the SDK performs no schema validation.',
              ],
            },
          ],
        },
        signature: 'sendCustomMessage(options: { businessId: string; data: string }): Promise<void>',
        roles: ALL_ROLES,
        events: [...barrageEvents],
        disabled: roomGate,
        successToast: {
          title: 'Custom message sent',
          description: 'The receiver gets it via onCustomMessageReceived; it does NOT enter messageList',
        },
        fields: [
          {
            key: 'businessId',
            label: 'businessId',
            type: 'text',
            default: 'gift',
            placeholder: 'Business tag, a custom string (e.g. gift / lucky_bag / entrance)',
          },
          {
            key: 'data',
            label: 'data (string)',
            type: 'json',
            // The contract says `data: string`. We use the json field for the
            // textarea affordance, then pass the raw string through.
            default: '{ "giftId": "rose", "count": 5, "price": 10 }',
            help: 'Any string; usually a JSON-serialized business payload whose schema is agreed by the business side',
          },
        ],
        run: async ({ inputs, t }) => {
          const businessId = String(inputs.businessId || '').trim();
          if (!businessId) {
            throw new Error(t('Error.BarrageBusinessIdEmpty', 'businessId cannot be empty'));
          }
          // Although JSON strings are recommended for `data`, the SDK only
          // requires a string, so integrators may choose other formats (e.g.
          // Base64 protobuf); we therefore do not strictly validate JSON.
          const data = typeof inputs.data === 'string' ? inputs.data : String(inputs.data ?? '');
          await barrage.sendCustomMessage({ businessId, data });
          return { sent: true, businessId, data };
        },
        snippet: `const { sendCustomMessage, subscribeEvent } = useBarrageState();
import { BarrageEvent } from 'tuikit-atomicx-vue3';

// Sender side: serialize the business payload.
await sendCustomMessage({
  businessId: 'gift',
  data: JSON.stringify({ giftId: 'rose', count: 5 }),
});

// Receiver side: custom messages do not enter messageList; subscribe to the event and parse it yourself.
subscribeEvent(BarrageEvent.onCustomMessageReceived, (msg) => {
  if (msg.businessId === 'gift') {
    const payload = JSON.parse(msg.data ?? '{}');
    console.log('received gift', payload);
  }
});`,
      },
      {
        id: 'live-barrage.appendLocalTip',
        api: 'appendLocalTip',
        title: 'Append local system tip',
        description: 'Locally construct a Barrage and push it straight into messageList.',
        notes: {
          summary: 'appendLocalTip · local only',
          groups: [
            {
              tone: 'must',
              items: [
                'Local only: does not send to the server, the other side cannot see it. Use for pure client-side UX notices like "Welcome X to the live room" / "the host is about to go live", to avoid occupying a real barrage channel.',
              ],
            },
          ],
        },
        signature: 'appendLocalTip(message: Barrage): void',
        roles: ALL_ROLES,
        events: [...barrageEvents],
        disabled: roomGate,
        successToast: {
          title: 'Local tip appended',
          description: 'Only updates this side\'s messageList; the other side will not receive it',
        },
        fields: [
          {
            key: 'text',
            label: 'tip text',
            type: 'text',
            default: 'Welcome to the live stream!',
            placeholder: 'Local tip text to append',
          },
        ],
        run: async ({ inputs, t }) => {
          const text = String(inputs.text || '');
          if (!text) {
            throw new Error(t('Error.BarrageTipEmpty', 'tip text cannot be empty'));
          }
          // Synthesize a self-attributed local Barrage. `sequence` uses
          // Date.now() so it sorts at the tail of any server-driven list;
          // `liveId` is taken from current session (best-effort — empty when
          // not yet joined, the SDK doesn't validate this field for local
          // tips).
          const tip: Barrage = {
            liveId: session.liveId || '',
            sender: {
              userId: 'system',
              userName: 'System',
              avatarUrl: '',
            } as Barrage['sender'],
            sequence: Date.now(),
            timestampInSecond: Math.floor(Date.now() / 1000),
            messageType: BarrageType.text,
            textContent: text,
            extensionInfo: { type: 'local-tip' },
          };
          barrage.appendLocalTip(tip);
          return { appended: true, messageCount: barrage.messageList.value.length };
        },
        snippet: `import { useBarrageState, BarrageType } from 'tuikit-atomicx-vue3';
import type { Barrage } from 'tuikit-atomicx-vue3';

const { appendLocalTip } = useBarrageState();
const tip: Barrage = {
  liveId: 'current-live-id',
  sender: { userId: 'system', userName: 'System', avatarUrl: '' } as Barrage['sender'],
  sequence: Date.now(),
  timestampInSecond: Math.floor(Date.now() / 1000),
  messageType: BarrageType.text,
  textContent: 'Welcome to the live stream!',
  extensionInfo: { type: 'local-tip' },
};
appendLocalTip(tip);`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-barrage',
        hookName: 'useBarrageState',
        eventEnumName: 'BarrageEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-barrage', hook: 'useBarrageState', title: 'Barrage', category: '6.8', source: 'BarrageState/BarrageState.ts' };
export { useBarrageExamples, useBarrageExamples as factory };
