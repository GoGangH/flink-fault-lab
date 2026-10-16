/**
 * 덱의 한 페이지. Deck이 .cur 클래스로 현재 페이지만 보여준다.
 * className에 display 유틸리티(flex, grid 등)를 넣으면 숨김 규칙을 덮어쓰니 안쪽 요소에 넣는다.
 */
export default function Section({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className ?? "min-h-[calc(100vh-60px)] pt-14 pb-16 max-sm:pt-10 max-sm:pb-12"}>
      {children}
    </section>
  );
}
