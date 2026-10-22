# 의견: «3D 제품» 방향 + 손님 사진이 있으면 발주문이 멈춤

uf-service는 고치지 않았다. 의견만 남긴다.

## 증상
- `makeStageOrder(stage, { kind: { directions: ['product'] }, photos: N>0, ... })` 를 운영 설정(헤드리스 끔)으로 부르면 세 단계 모두 `ORDER_TEMPLATE_DRIFT` 로 멈춘다.
- `photos: 0` 이면 정상.
- 확인: uf-service main `2b95653`, node 22.

## 추정 원인
- `makeOrder` 의 사진 있음 갈래(`photoLines`)는 원래 주문 13·14행(`No 3D world and no Blender. A WebGL layer is allowed only for image effects…`)을 그대로 두고, 사진 없음 갈래는 다른 줄을 쓴다.
- `W2MAT` / `W2PRODUCT` 의 `containsRegex` 나 `contains` 가 찾는 줄이 둘 중 한 갈래에만 정확히 한 번 있어서, 다른 갈래에서는 `one()` 이 0곳 또는 2곳을 찾는 것으로 보인다.
- 「3D 제품」은 손님이 제품 사진을 올릴 가능성이 높은 종류라 실제 손님에게서 먼저 터질 수 있다.

## 제안
- `test/sek-stages.test.mjs` 에 종류 × 단계 × (사진 0 / 사진 있음) × (헤드리스 끔 / 켬) 전 조합을 만들어 보는 시험을 더한다.
- 같은 방식으로 보면 「게임」과 「3D 제품」은 헤드리스 켬(`UF_SEK_HEADLESS=1`)에서도 멈춘다. 지금 운영은 헤드리스 끔이라 영향은 없지만, 켜는 날 같이 터진다.
