/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 * test
 */

import "./style.css";

import {
  fromEvent,
  interval,
  merge,
  Subscription,
  BehaviorSubject,
} from "rxjs";
import { map, filter, scan, switchMap, mergeMap } from "rxjs/operators";
import { Key, Action, MoveKey, keyCodes, State, Difficulties } from "./type";
import {
  moveKeys,
  otherKeys,
  keyToActionMap,
  DifficultyMap,
  Block,
} from "./constants";
import {
  Tick,
  Hold,
  Rotate,
  Drop,
  Collision,
  Move,
  initialState,
} from "./state";
import {
  render,
  show,
  hide,
  gameover,
  clearBlocks,
  svg,
  holdView,
  preview,
} from "./render";
import { RNG } from "./util";

/**
 * main game loop
 */
export function main() {
  // creates an Observable of Action and only allow 1 Observable to be fired
  // per key press
  const fromKeyNoRepeat = (keyCode: Key, action: Action) =>
    keydown$.pipe(
      filter(({ code }) => {
        return code === keyCode;
      }),
      filter(({ repeat }) => !repeat),
      map(() => action)
    );

  // Listen to key up and down
  const keydown$ = fromEvent<KeyboardEvent>(document, "keydown");
  const keyup$ = fromEvent<KeyboardEvent>(document, "keyup");

  const keyEvents$ = merge(keydown$, keyup$);

  /**
   * only take keyCodes of MoveKey and Key, and map them to a keycodes object,
   * then accumulate/replace the keycode in the keystates which is an array of keycodes
   */
  const keyState$ = keyEvents$.pipe(
    filter(
      ({ code }) =>
        moveKeys.includes(code as MoveKey) || otherKeys.includes(code as Key)
    ),
    map(({ code, type }) => ({
      keyCode: code as MoveKey | Key,
      isPressing: type === "keydown" && moveKeys.includes(code as MoveKey),
    })),
    scan((keyStates: ReadonlyArray<keyCodes>, key: keyCodes) => {
      const existingIndex = keyStates.findIndex(
        (keyState) => keyState.keyCode === key.keyCode
      );
      if (existingIndex !== -1) {
        // Update the existing key state
        return [
          ...keyStates.slice(0, existingIndex),
          key,
          ...keyStates.slice(existingIndex + 1),
        ];
      } else {
        // Add a new key state
        return [...keyStates, key];
      }
    }, [])
  );
  /**
   * With the accumulated keyStates, if the isPressing value is true then
   * accumulate the Action into the accumulator
   */
  const movement$ = keyState$.pipe(
    map((state) => {
      return state.reduce(
        (acc: ReadonlyArray<Action>, { keyCode, isPressing }: keyCodes) =>
          isPressing ? [...acc, keyToActionMap[keyCode as MoveKey]] : acc,
        []
      ) as ReadonlyArray<Action>;
    })
  );

  const rotate$ = fromKeyNoRepeat("ArrowUp", new Rotate());
  const hold$ = fromKeyNoRepeat("KeyC", new Hold());
  const drop$ = fromKeyNoRepeat("Space", new Drop());

  /** Rate of checking the current block, creation of current block,
   *  update ghost block location and check for line clears
   */
  const tick$ = interval(10).pipe(map((time) => new Tick(time)));
  /**
   * Rate of checking for collision
   */
  const collideTick$ = interval(1000).pipe(map(() => new Collision()));

  // start of game
  function startGame(initialState: State, restartSub: Subscription | null) {
    // calculate the interval time
    const startingTickRate = (DifficultyMap[0] / 60) * 1000;
    // create a behaviorsubject storing the current tick down time
    const gameTick$ = new BehaviorSubject(startingTickRate);

    // create an interval based on the current tick down time,
    // when tick down time changes, switch map will reset the interval
    const downTick$ = gameTick$.pipe(
      switchMap((tick) =>
        interval(tick).pipe(map(() => new Move("y", Block.HEIGHT)))
      )
    );

    const actions$ = merge(
      downTick$,
      tick$,
      movement$.pipe(mergeMap((move) => move)), // flatten the array of observables
      rotate$,
      hold$,
      collideTick$,
      drop$
    );
    const state$ = actions$.pipe(
      scan(
        (state: State, action: Action) => action.perform(state),
        initialState
      )
    );

    const subscriber = state$.subscribe((s: State) => {
      if (s.changeInLevel) {
        // if level changes then update the tick rate
        const updatedTickRate =
          (DifficultyMap[Math.min(29, s.level) as Difficulties] / 60) * 1000;

        gameTick$.next(updatedTickRate);
      }

      render(s);

      if (s.gameEnd) {
        show(gameover);
        subscriber.unsubscribe();
        // listen for Enter key press to restart game
        const restartSub = fromEvent<KeyboardEvent>(document, "keydown")
          .pipe(filter(({ key }) => key === "Enter"))
          .subscribe(() => {
            // clear all blocks for screen
            clearBlocks(s.blocks, svg);
            clearBlocks(s.currentBlock!.cells, svg);
            clearBlocks(s.nextBlock!.cells, preview);
            clearBlocks(s.heldBlock?.cells, holdView);

            // call the start game function with changes to the initial state to
            // restart the game
            startGame(
              {
                ...initialState,
                highscore: s.highscore,
                seed: RNG.hash(s.seed),
              },
              restartSub
            );
          });
      } else {
        hide(gameover);
        // unsub to the restart subscriber
        if (restartSub) restartSub.unsubscribe();
      }
    });
  }

  startGame(initialState, null);
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
