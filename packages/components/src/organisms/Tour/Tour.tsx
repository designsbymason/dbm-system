import { mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as PopperPrimitive from "@radix-ui/react-popper";
import { Portal as PortalPrimitive } from "@radix-ui/react-portal";
import { Presence } from "@radix-ui/react-presence";
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
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
import { defaultLabelsFor, holeClipPath, labelsForStep, physicalSide, plainTitle, scrollTargetIntoView } from "./tourHelpers";
import { useTourController } from "./useTourController";
import { useTourSpotlight } from "./useTourSpotlight";
import { useTourState } from "./useTourState";

/**
 * Pixels between the spotlight and the card. A layout distance handed to the positioning engine, like `Popover`'s
 * `sideOffset`, not a style.
 */
const CARD_OFFSET = 12;
const COLLISION_PADDING = 8;

/**
 * A guided tour of a page that is already on screen: a sequence of steps, each dimming the page except one element (the
 * spotlight) and putting a card beside it with the step's heading and text, Back, Next and Skip.
 *
 * The steps are data (`steps`), and the step showing is its `value` (an id), controlled or not. The tour opens from code:
 * pass `open`, or use `controllerRef`. It has no trigger of its own. What the person finishes or skips is reported to
 * `onOpenChange` with a reason, which is where an app remembers that the tour has been seen (`usePersistentDismiss`).
 *
 * While it is open the dimmed page cannot be pressed (a step marked `interactive` leaves a hole over its element), the
 * page can still be scrolled, and focus stays inside the card. A step with no `target`, or whose element does not appear,
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
    useTourController(controllerRef, state);
    const { open, step, index, requestClose, next, back } = state;
    const total = steps.length;
    const visible = open && total > 0;

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

    const spot = useTourSpotlight({ step, active: visible, layerRef: originRef, timeout: targetTimeout, onMissing: onTargetMissing });
    const centered = spot.status !== "found";
    const docked = resolvedPresentation === "docked";
    const placement = centered ? "centered" : docked ? "docked" : "anchored";
    const interactive = Boolean(step?.interactive) && !centered;
    // The card waits for a box measured for this very step, so it is drawn once, in its place.
    const cardReady = spot.rect !== null && spot.status !== "waiting" && spot.rect.owner === spot.element;

    // Development checks, once per message.
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      const ids = new Set<string>();
      for (const candidate of steps) {
        if (ids.has(candidate.id)) warnOnce(`Tour: two steps share the id "${candidate.id}"; each id must be unique.`);
        ids.add(candidate.id);
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

    // Move to a step: bring the element into view, clear of a docked card.
    useEffect(() => {
      const element = spot.element;
      if (!visible || !element) return;
      const reserve = docked && card ? Math.max(0, window.innerHeight - card.getBoundingClientRect().top) : 0;
      scrollTargetIntoView(element, reserve, !reducedMotion);
      // Only when the element or the layout changes, not on every card render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, spot.element, docked]);

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

    // Keep focus on the control that was pressed across a step, even when the card is drawn afresh or Back is gone.
    const pendingFocus = useRef<TourAction | null>(null);
    const stepId = step?.id;
    useEffect(() => {
      const wanted = pendingFocus.current;
      // The card is drawn afresh while the next step's element is looked for; wait for the one that is in the page.
      if (!wanted || !card?.isConnected) return;
      pendingFocus.current = null;
      const control =
        card.querySelector<HTMLElement>(`[data-tour-action="${wanted}"]`) ??
        card.querySelector<HTMLElement>('[data-tour-action="next"]');
      if (control && control !== document.activeElement) control.focus({ preventScroll: true });
    }, [card, stepId]);

    // Escape closes, wherever focus is.
    useEffect(() => {
      if (!visible) return undefined;
      const onKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
        requestClose("escape");
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [visible, requestClose]);

    const onAction = useCallback(
      (action: TourAction) => {
        if (action === "skip") {
          requestClose("skip");
          return;
        }
        pendingFocus.current = action;
        if (action === "next") next();
        else back();
      },
      [requestClose, next, back],
    );

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const inField = (event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']");
      if (!interactive && !inField && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        const forward = (event.key === "ArrowRight") === (dir === "ltr");
        pendingFocus.current = forward ? "next" : "back";
        if (forward) next();
        else back();
        return;
      }
      // On a step that lets the page be used, Tab from the card's last control goes on into the highlighted element.
      if (interactive && event.key === "Tab" && !event.shiftKey && spot.element) {
        const controls = event.currentTarget.querySelectorAll<HTMLElement>("[data-tour-action]");
        if (event.target === controls[controls.length - 1]) {
          const inside = spot.element.matches("a[href], button, input, select, textarea, [tabindex]")
            ? spot.element
            : spot.element.querySelector<HTMLElement>("a[href], button, input, select, textarea, [tabindex]");
          if (inside) {
            event.preventDefault();
            inside.focus();
          }
        }
      }
    };

    const onMountAutoFocus = (event: Event) => {
      event.preventDefault();
      if (!pendingFocus.current) cardNode.current?.focus({ preventScroll: true });
    };

    const padding = centered ? 0 : (step?.padding ?? 2);
    const layerStyle = {
      "--tour-padding": `var(--dbm-space-${padding})`,
      ...(scrimOpacity === undefined ? null : { "--tour-scrim-opacity": String(scrimOpacity) }),
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

    const cardElement = step && cardReady && (
      <TourCard
        {...rest}
        ref={cardRef}
        title={step.title}
        content={step.content}
        titleId={titleId}
        contentId={contentId}
        index={index}
        total={total}
        labels={labels}
        progress={progress}
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
        onKeyDown={onKeyDown}
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
          {spot.rect && <div ref={ringRef} className={styles.ring} style={ringStyle} aria-hidden="true" />}
          <PopperPrimitive.Root>
            <PopperPrimitive.Anchor virtualRef={ringRef} />
            {cardElement && (
              <FocusTrap
                asChild
                trapped={visible && !interactive}
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
                    updatePositionStrategy="always"
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
