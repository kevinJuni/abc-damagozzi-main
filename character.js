class Character {
  img = document.createElement("img");

  // 상태 관리 변수
  state = "walk";

  // 현재 위치
  position = 0;

  // 속도
  speed = 1;

  // 방향 1: right, -1: left
  direction = 1;

  // 마우스 따라가기 목표 위치
  targetPosition = null;

  imageUrlObj = {
    walk: "fox/red_walk_8fps.gif",
    sleep: "fox/red_sleep_8fps.gif",
    run: "fox/red_run_8fps.gif",
    idle: "fox/red_idle_8fps.gif",
  };

  rightEdge = window.innerWidth;
  leftEdge = 0;

  timers = new Set();

  animationId = null;
  parentNode;
  constructor(imageUrl) {
    this.img.src = chrome.runtime.getURL(this.imageUrlObj["walk"]);
    this.img.style.position = "fixed";
    this.img.style.left = this.position + "px";
    this.img.style.bottom = "0px";
    this.img.style.width = "35px";
    this.img.style.height = "35px";
    this.img.style.zIndex = "9999";
    this.img.draggable = true;
    document.body.appendChild(this.img);
    this.parentNode = document.body;
    this.startMoving();
    this.setupBodyEventListeners();
    this.setupImageEventListeners();
  }

  clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
  }

  addTimer(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    this.timers.add(timerId);
    return timerId;
  }

  // 상태에 따른 이미지 변경 처리...
  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    switch (newState) {
      case "walk":
        this.speed = 1;
        this.changeImageTo("walk");
        break;
      case "run":
        this.speed = 5;
        this.changeImageTo("run");
        break;
      case "idle":
        this.speed = 0;
        this.changeImageTo("idle");
        break;
      case "followMouse":
        this.speed = 1;
        this.changeImageTo("walk");
        break;
    }
  }
  changeImageTo(imageName) {
    this.img.src = chrome.runtime.getURL(this.imageUrlObj[imageName]);
  }
  move() {
    if (
      (this.state === "followMouse" || this.state === "run") &&
      this.targetPosition !== null
    ) {
      let distance = Math.abs(this.position - this.targetPosition);
      if (distance <= this.speed) {
        this.setState("idle");
        this.targetPosition = null;

        this.addTimer(() => {
          if (this.state === "idle") {
            this.rightEdge = window.innerWidth;
            this.setState("walk");
          }
        }, 3000);
        this.animationId = requestAnimationFrame(this.move.bind(this));
        return;
      }
      distance =
        this.direction < 0
          ? Math.abs(this.leftEdge - this.position)
          : Math.abs(this.position - (this.rightEdge - 35));
      if (this.parentNode !== document.body && distance < this.speed) {
        this.setState("idle");
        this.targetPosition = null;

        this.addTimer(() => {
          if (this.state === "idle") {
            // this.rightEdge = window.innerWidth;
            this.setState("walk");
          }
        }, 3000);
        this.animationId = requestAnimationFrame(this.move.bind(this));
        return;
      }
    }

    if (this.speed > 0) {
      this.position = this.position + this.speed * this.direction;
      this.img.style.left = this.position + "px";
      this.turnAtEdge();
    }

    this.animationId = requestAnimationFrame(this.move.bind(this));
  }

  startMoving() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.move();
  }

  reverse(direction) {
    this.direction = direction;
    this.img.style.transform = `scaleX(${direction})`;
  }

  turnAtEdge() {
    if (this.position >= this.rightEdge - 35) {
      this.reverse(-1);
    }
    if (this.position <= this.leftEdge) {
      this.reverse(1);
    }
  }

  setupBodyEventListeners() {
    let isDoubleClick = false;

    // 더블클릭으로 달리기/걷기 전환
    document.body.addEventListener("dblclick", (e) => {
      e.preventDefault();
      isDoubleClick = true;

      this.followMouseToPosition(e.clientX, "run");
      setTimeout(() => {
        isDoubleClick = false;
      }, 300);
    });

    document.body.addEventListener("click", (e) => {
      if (isDoubleClick) return;

      this.followMouseToPosition(e.clientX, "followMouse");
    });
    document.addEventListener("dragenter", (e) => {
      // this.img.style
      // dropTarget = e.target; // 지금 마우스가 들어간 요소
    });

    this.img.addEventListener("drag", (e) => {
      // console.log(e);
    });
    this.img.addEventListener("dragend", (e) => {
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      this.parentNode = elementBelow;
      if (elementBelow) {
        const rect = elementBelow.getBoundingClientRect();
        this.leftEdge = rect.left;
        this.rightEdge = rect.right;

        this.position = e.clientX;
        this.img.style.left = this.position + "px";
        this.img.style.bottom = window.innerHeight - rect.bottom + "px";
      }

      // 이동 애니메이션 재시작
      this.startMoving();
    });
  }

  setupImageEventListeners() {}
  // 마우스 따라가는 함수...
  followMouseToPosition(clickX, state) {
    this.clearAllTimers();
    this.setState(state);
    this.targetPosition = clickX;
    let edge = clickX > this.rightEdge ? this.rightEdge : clickX;
    // 마우스 위치에따라 여우 뒤돌기 안돌기...
    if (this.position < edge) {
      this.reverse(1);
    } else {
      this.reverse(-1);
    }
  }

  // 제거..
  destroy() {
    this.clearAllTimers();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.img && this.img.parentNode) {
      this.img.parentNode.removeChild(this.img);
    }
  }
}

window.Character = Character;
