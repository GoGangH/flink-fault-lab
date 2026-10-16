/**
 * 발표 창(/)과 발표자 대본 창(/presenter)이 같은 브라우저 안에서 현재 페이지를 주고받는 채널.
 * 발표 창이 page를 알리고, 대본 창은 go로 페이지를 넘기거나 hello로 현재 페이지를 묻는다.
 */
export type DeckMsg = { type: "page"; id: string } | { type: "go"; id: string } | { type: "hello" };

const NAME = "flink-fault-lab-deck";

export function openDeckChannel(onMsg: (m: DeckMsg) => void) {
  if (typeof BroadcastChannel === "undefined") return { post: () => {}, close: () => {} };
  const ch = new BroadcastChannel(NAME);
  ch.onmessage = (e: MessageEvent<DeckMsg>) => onMsg(e.data);
  return { post: (m: DeckMsg) => ch.postMessage(m), close: () => ch.close() };
}
