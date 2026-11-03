import { mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopperPrimitive from "@radix-ui/react-popper";
import { Portal as PortalPrimitive } from "@radix-ui/react-portal";
import { Presence } from "@radix-ui/react-presence";
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent } from "react";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FocusTrap } from "../../atoms/FocusTrap";
import { OverlayArrow } from "../../internal/OverlayArrow/OverlayArrow";
import { useReturnFocus } from "../../internal/overlay/useReturnFocus";
import { useReducedMotion } from "../../internal/useReducedMotion";
import { warnOnce } from "../../internal/warnOnce";
import styles from "./Tour.module.css";
import { TourCard } from "./TourCard";
import type { TourAction } from "./TourCard";
import type { TourProps } from "./Tour.types";
import {
  defaultLabelsFor,
  focusablesIn,
  holeClipPath,
  labelsForStep,
  physicalSide,
  plainTitle,
  scrollTargetIntoView,
} from "./tourHelpers";
import { useKeyboardInset } from "./useKeyboardInset";
import { useTourController } from "./useTourController";
import { useTourSpotlight } from "./useTourSpotlight";
import { useTourState } from "./useTourState";

/**
 * Pixels between the spotlight and the card. A layout distance handed to the positioning engine, like `Popover`'s
 * `sideOffset`, not a style.
 */
const CARD_OFFSET = 12;
const COLLISION_PADDING = 8;
const NO_DISMISSALS: never[] = [];

/**
 * A guided tour of a page that is already on screen: a sequence of steps, each dimming the page except one element (the
 * spotlight) and putting a card beside it with the step's heading and text, Back, Next and Skip.
 *
 * The steps are data (`steps`), and the step showing is its `value` (an id), controlled or not. The tour opens from code:
 * pass `open`, or use `controllerRef`. It has no trigger of its own. What the person finishes or skips is reported to
 * `onOpenChange` with a reason, which is where an app remembers that the tour has been seen (`usePersistentDismiss`).
 *
 * While it is open the dimmed page cannot be pressed (a step marked `interactive` or with `advanceOn` leaves a hole over its
 * element), the page can still be scrolled, and focus stays inside the card. It can be drawn inside a modal `Dialog`: render it
 * inside `Dialog.Content`, so a press on it is not read as a press outside the dialog. A step with no `target`, or whose element does not appear,
 * is a card in the middle of the screen. On a phone, `presentation="docked"` pins the card across the bottom.
 *
 * It renders its card in a portal and forwards `ref`, `className`, `style`, `id` and `data-testid` to the card, the
 * element with `role="dialog"`.
 *
 * @example
 * ```tsx
 * <Tour
 *   open={open}
 *   onOpenChange={setOpen}
 *   steps={[
 *     { id: "search", target: "#search", title: "Search", content: "Find anything from here." },
 *     { id: "done", title: "That's it", content: "You can start the tour again from Help." },
 *   ]}
 * />
 * ```
 */
export const Tour = forwardRef<HTMLDivElement, TourProps>(
  (
    {
      steps,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      value: valueProp,
      defaultValue,
      onValueChange,
      presentation = "anchored",
      progress = "text",
      dismissals = [],
      dismissalsOn = "all",
      missingTarget = "center",
      scrollOffset,
      scrimOpacity,
      closeOnOutsidePress = false,
      targetTimeout = 1000,
      onTargetMissing,
      container,
      dir = "ltr",
      labels: labelsProp,
      formatNumber = String,
      controllerRef,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      onKeyDown: consumerKeyDown,
      onFocus: consumerFocus,
      onBlur: consumerBlur,
      ...rest
    },
    ref,
  ) => {
    const state = useTourState({
      steps,
      openProp,
      defaultOpen,
      onOpenChange,
      valueProp,
      defaultValue,
      onValueChange,
    });
    const controller = useTourController(controllerRef, state);
    const { open, step, index, requestClose, next, back } = state;
    const total = steps.length;
    const visible = open && total > 0;
    const stepId = step?.id;

    const labels = labelsForStep(
      mergeDefined(defaultLabelsFor(formatNumber, labelsProp?.stepOf), labelsProp),
      step,
    );
    const resolvedPresentation = useResolvedResponsiveValue(presentation, "anchored");
    const reducedMotion = useReducedMotion();
    const reactId = useId();
    const titleId = `${reactId}-title`;
    const contentId = `${reactId}-content`;

    const originRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const [card, setCard] = useState<HTMLDivElement | null>(null);
    const cardNode = useRef<HTMLDivElement | null>(null);
    const cardRef = useMemo(() => mergeRefs(ref, setCard, cardNode), [ref]);

    // A step's `onEnter` runs before its element is looked for; the card waits for it.
    // While the dismissals menu is open it holds focus, and the card's own trap stands down so the two do not fight over it.
    const [menuOpen, setMenuOpen] = useState(false);
    const [entered, setEntered] = useState<string | null>(null);
    const latestStep = useRef(step);
    useEffect(() => {
      latestStep.current = step;
    });
    useEffect(() => {
      if (!visible || stepId === undefined) return undefined;
      let cancelled = false;
      const id = stepId;
      Promise.resolve()
        .then(() => latestStep.current?.onEnter?.())
        .catch((error: unknown) => {
          warnOnce(`Tour: the onEnter of the step "${id}" threw (${String(error)}); the step is shown anyway.`);
        })
        .then(() => {
          if (!cancelled) setEntered(id);
        });
      return () => {
        cancelled = true;
      };
    }, [visible, stepId]);
    useEffect(
      () => () => {
        setEntered(null);
      },
      [visible],
    );
    const hold = visible && Boolean(step?.onEnter) && entered !== stepId;

    const spot = useTourSpotlight({
      step,
      active: visible,
      layerRef: originRef,
      timeout: targetTimeout,
      hold,
      onMissing: onTargetMissing,
    });
    const centered = spot.status !== "found";
    const docked = resolvedPresentation === "docked";
    const placement = centered ? "centered" : docked ? "docked" : "anchored";
    const interactive = (step?.interactive ?? step?.advanceOn !== undefined) && !centered;

    // Which way the person is going, so a step whose element is missing is skipped in that direction.
    const [direction, setDirection] = useState<1 | -1>(1);
    const missingMode = step?.missingTarget ?? missingTarget;
    const canSkip = direction === 1 ? index < total - 1 : index > 0;
    const skipping = spot.status === "missing" && missingMode === "skip" && canSkip;
    useEffect(() => {
      if (!skipping) return;
      if (direction === 1) next();
      else back();
    }, [skipping, direction, next, back]);

    // The card waits for a box measured for this very step, so it is drawn once, in its place.
    const cardReady =
      spot.rect !== null && spot.status !== "waiting" && !skipping && spot.rect.owner === spot.element;

    // Development checks, once per message.
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      const ids = new Set<string>();
      for (const candidate of steps) {
        if (ids.has(candidate.id)) warnOnce(`Tour: two steps share the id "${candidate.id}"; each id must be unique.`);
        ids.add(candidate.id);
        if (candidate.advanceOn && candidate.target === undefined) {
          warnOnce(`Tour: the step "${candidate.id}" has advanceOn but no target, so nothing can advance it.`);
        }
      }
      if (open && steps.length === 0) warnOnce("Tour: it is open but has no steps, so nothing is drawn.");
    }, [steps, open]);

    // Give focus back to whatever had it when the tour opened.
    const { remember, restore } = useReturnFocus();
    useLayoutEffect(() => {
      if (!visible) return undefined;
      remember();
      return () => restore(new Event("tour"));
    }, [visible, remember, restore]);

    // Move to a step: bring the element into view, clear of a docked card and of a sticky header or footer.
    const offsetTop = scrollOffset?.top;
    const offsetBottom = scrollOffset?.bottom;
    useEffect(() => {
      const element = spot.element;
      if (!visible || !element) return;
      const reserve = docked && card ? Math.max(0, window.innerHeight - card.getBoundingClientRect().top) : 0;
      scrollTargetIntoView(element, { reserve, offset: { top: offsetTop, bottom: offsetBottom }, smooth: !reducedMotion });
      // Only when the element or the layout changes, not on every card render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, spot.element, docked, offsetTop, offsetBottom]);

    // A step that advances by itself when its element is used.
    const advanceOn = step?.advanceOn;
    useEffect(() => {
      const element = spot.element;
      if (!visible || !advanceOn || !element) return undefined;
      let fired = false;
      let timer = 0;
      const onEvent = () => {
        if (fired) return;
        fired = true;
        // After the element's own handlers have run.
        timer = window.setTimeout(next, 0);
      };
      element.addEventListener(advanceOn, onEvent, true);
      return () => {
        element.removeEventListener(advanceOn, onEvent, true);
        window.clearTimeout(timer);
      };
    }, [visible, advanceOn, spot.element, next]);

    // Say which step it is on, when it changes. The first appearance is read out by the card getting focus.
    const { message, announce } = useAnnouncement();
    const announced = useRef<string | null>(null);
    useEffect(() => {
      if (!visible || !step) return;
      if (announced.current === null) {
        announced.current = step.id;
        return;
      }
      if (announced.current === step.id) return;
      announced.current = step.id;
      const title = plainTitle(step);
      if (title) announce(labels.announcement(index + 1, total, title));
    }, [visible, step, index, total, labels, announce]);
    useEffect(
      () => () => {
        announced.current = null;
      },
      [visible],
    );

    // Keep focus where it was across a step or a change of form (anchored to docked and back), even when the card is drawn
    // afresh or the control that was pressed is gone: on that control by name, else the card.
    const pendingFocus = useRef<TourAction | "card" | null>(null);
    const focusState = useRef<{ inside: boolean; action: TourAction | null }>({ inside: false, action: null });
    useEffect(() => {
      if (!card?.isConnected) return;
      let wanted = pendingFocus.current;
      const lost = document.activeElement === document.body || document.activeElement === null;
      if (!wanted && focusState.current.inside && lost) wanted = focusState.current.action ?? "card";
      if (!wanted) return;
      pendingFocus.current = null;
      const control =
        wanted === "card"
          ? card
          : (card.querySelector<HTMLElement>(`[data-tour-action="${wanted}"]`) ??
            card.querySelector<HTMLElement>('[data-tour-action="next"]') ??
            card);
      if (control !== document.activeElement) control.focus({ preventScroll: true });
    }, [card, stepId]);
    useEffect(
      () => () => {
        focusState.current = { inside: false, action: null };
      },
      [visible],
    );
    const onCardFocus = (event: FocusEvent<HTMLDivElement>) => {
      consumerFocus?.(event);
      // A menu opened from the card is drawn in a portal and its focus reaches this handler through React, not the DOM.
      if (!event.currentTarget.contains(event.target)) return;
      const action = (event.target as HTMLElement).getAttribute("data-tour-action") as TourAction | null;
      focusState.current = { inside: true, action };
    };
    const onCardBlur = (event: FocusEvent<HTMLDivElement>) => {
      consumerBlur?.(event);
      const to = event.relatedTarget as Node | null;
      // A blur to nowhere is what removing the focused card looks like; only a move to another element leaves it.
      if (to && !event.currentTarget.contains(to)) focusState.current = { inside: false, action: null };
    };

    // Escape closes, wherever focus is, and is not passed on: a tour inside a dialog must not close the dialog too.
    useEffect(() => {
      if (!visible) return undefined;
      const onKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key !== "Escape" || event.isComposing) return;
        // An open menu (the dismissals) takes the key first, and closes alone.
        if (menuOpen) return;
        event.stopPropagation();
        requestClose("escape");
      };
      window.addEventListener("keydown", onKeyDown, true);
      return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [visible, requestClose, menuOpen]);

    // On a step that lets the page be used, Tab moves between the card and the element's own controls, both ways.
    const targetElement = spot.element;
    useEffect(() => {
      if (!visible || !interactive || !targetElement) return undefined;
      const onKeyDown = (event: globalThis.KeyboardEvent) => {
        // The card's own handler has already moved focus on a press that began there.
        if (event.key !== "Tab" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        const active = document.activeElement as HTMLElement | null;
        if (!active || !targetElement.contains(active)) return;
        const controls = focusablesIn(targetElement);
        const edge = event.shiftKey ? controls[0] : controls[controls.length - 1];
        if (active !== edge && controls.length > 0) return;
        const own = card ? focusablesIn(card) : [];
        const to = event.shiftKey ? own[own.length - 1] : own[0];
        if (!to) return;
        event.preventDefault();
        to.focus();
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [visible, interactive, targetElement, card]);

    const onAction = useCallback(
      (action: TourAction) => {
        if (action === "skip" || action === "later" || action === "never") {
          requestClose(action);
          return;
        }
        pendingFocus.current = action;
        setDirection(action === "next" ? 1 : -1);
        if (action === "next") next();
        else back();
      },
      [requestClose, next, back],
    );

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      // The caller's own handler first; one that handled the key has it.
      consumerKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      // Keys pressed in the dismissals menu, drawn in a portal, reach this handler through React; they are the menu's.
      if (!event.currentTarget.contains(event.target as Node)) return;
      const inField = (event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']");
      if (!interactive && !inField && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        const forward = (event.key === "ArrowRight") === (dir === "ltr");
        pendingFocus.current = forward ? "next" : "back";
        setDirection(forward ? 1 : -1);
        if (forward) next();
        else back();
        return;
      }
      // On a step that lets the page be used, the card's ends hand Tab on to the element's controls, or round to each other.
      if (interactive && event.key === "Tab") {
        const own = focusablesIn(event.currentTarget);
        const controls = spot.element ? focusablesIn(spot.element) : [];
        if (!event.shiftKey && event.target === own[own.length - 1]) {
          event.preventDefault();
          (controls[0] ?? own[0])?.focus();
        } else if (event.shiftKey && (event.target === own[0] || event.target === event.currentTarget)) {
          event.preventDefault();
          (controls[controls.length - 1] ?? own[own.length - 1])?.focus();
        }
      }
    };

    const onMountAutoFocus = (event: Event) => {
      event.preventDefault();
      if (!pendingFocus.current && !focusState.current.inside) cardNode.current?.focus({ preventScroll: true });
    };

    // The spotlight eases to a new step, and only then: for a moment after the step changes.
    const [easeStep, setEaseStep] = useState(stepId);
    const [easing, setEasing] = useState(false);
    if (easeStep !== stepId) {
      setEaseStep(stepId);
      setEasing(true);
    }
    useEffect(() => {
      if (!easing) return undefined;
      // `transitionend` ends it; this is for a transition that never runs (reduced motion, no change of place).
      const timer = window.setTimeout(() => setEasing(false), 600);
      return () => window.clearTimeout(timer);
    }, [easing, stepId]);

    const keyboardInset = useKeyboardInset(visible && placement === "docked");
    const padding = centered ? 0 : (step?.padding ?? 2);
    const layerStyle = {
      "--tour-padding": `var(--dbm-space-${padding})`,
      ...(scrimOpacity === undefined ? null : { "--tour-scrim-opacity": String(scrimOpacity) }),
      ...(keyboardInset > 0 ? { "--tour-keyboard-inset": `${keyboardInset}px` } : null),
    } as CSSProperties;
    const ringStyle: CSSProperties | undefined = spot.rect
      ? {
          translate: `${spot.rect.x}px ${spot.rect.y}px`,
          inlineSize: spot.rect.width,
          blockSize: spot.rect.height,
        }
      : undefined;
    const shieldStyle: CSSProperties | undefined =
      interactive && spot.rect ? { clipPath: holeClipPath(spot.rect) } : undefined;

    const actions = typeof step?.actions === "function" ? step.actions(controller) : step?.actions;
    const cardElement = step && cardReady && (
      <TourCard
        {...rest}
        ref={cardRef}
        title={step.title}
        content={step.content}
        media={step.media}
        footer={step.footer}
        actions={actions}
        titleId={titleId}
        contentId={contentId}
        index={index}
        total={total}
        labels={labels}
        progress={progress}
        dismissals={dismissalsOn === "first" && index > 0 ? NO_DISMISSALS : dismissals}
        dir={dir}
        placement={placement}
        interactive={interactive}
        arrow={
          placement === "anchored" ? (
            <PopperPrimitive.Arrow asChild>
              <OverlayArrow />
            </PopperPrimitive.Arrow>
          ) : undefined
        }
        onAction={onAction}
        onMenuOpenChange={setMenuOpen}
        onKeyDown={onKeyDown}
        onFocus={onCardFocus}
        onBlur={onCardBlur}
        className={className}
        style={style}
        aria-label={ariaLabel ?? (typeof step.title === "string" || step.textValue ? undefined : labels.dialog)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      />
    );

    return (
      <Presence present={visible}>
        <PortalPrimitive
          container={container}
          className={styles.layer}
          data-state={visible ? "open" : "closed"}
          style={layerStyle}
        >
          <div ref={originRef} className={styles.origin} aria-hidden="true" />
          <div
            className={styles.shield}
            style={shieldStyle}
            aria-hidden="true"
            onPointerDown={closeOnOutsidePress ? () => requestClose("outside") : undefined}
          />
          {spot.rect && (
            <div
              ref={ringRef}
              className={styles.ring}
              style={ringStyle}
              data-easing={easing ? "" : undefined}
              onTransitionEnd={(event) => event.propertyName === "translate" && setEasing(false)}
              aria-hidden="true"
            />
          )}
          <PopperPrimitive.Root>
            <PopperPrimitive.Anchor virtualRef={ringRef} />
            {cardElement && (
              <FocusTrap
                asChild
                trapped={visible && !interactive && !menuOpen}
                loop={!interactive}
                onMountAutoFocus={onMountAutoFocus}
                onUnmountAutoFocus={(event) => event.preventDefault()}
              >
                {placement === "anchored" ? (
                  <PopperPrimitive.Content
                    asChild
                    side={physicalSide(step?.side ?? "bottom", dir)}
                    align={step?.align ?? "center"}
                    sideOffset={CARD_OFFSET}
                    collisionPadding={COLLISION_PADDING}
                    // Popper measures against the screen; a tour drawn into a box has to stay inside that box.
                    collisionBoundary={container ?? undefined}
                                      >
                    {cardElement}
                  </PopperPrimitive.Content>
                ) : (
                  cardElement
                )}
              </FocusTrap>
            )}
          </PopperPrimitive.Root>
          <VisuallyHidden role="status">{message}</VisuallyHidden>
        </PortalPrimitive>
      </Presence>
    );
  },
);
Tour.displayName = "Tour";
