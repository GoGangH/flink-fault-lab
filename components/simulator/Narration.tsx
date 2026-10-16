/** 지금 화면에서 일어나는 일을 한 문장으로 보여주는 상황 줄. 내용은 lib/simulator/narration.ts가 채운다. */
export default function Narration() {
  return (
    <div className="narr flex min-h-[60px] items-center gap-3 border-b border-line px-4 py-3" id="narr" data-tour="sim-narr">
      <span className="dot size-3 flex-none rounded-full" />
      <span className="text-[16px] leading-snug font-medium" id="narr-t">정상 처리 중</span>
    </div>
  );
}
