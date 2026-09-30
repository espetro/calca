import { trackExportComplete } from "@app/analytics";
import {
  CanvasArea,
  CanvasProvider,
  groupsAtom,
  hydrateGroups,
  resetSessionAtom,
  useCanvas,
} from "@app/canvas";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { CanvasHUD } from "#/features/canvas-hud";
import OnboardingBanner from "#/features/canvas-hud/ui/onboarding-banner";
import { useCommentHandlers } from "#/features/comments/hooks/use-comment-handlers";
import { ContextToolbar } from "#/features/context-toolbar";
import { useGenerationPipeline } from "#/features/design/hooks/use-generation-pipeline";
import { clipboardAtom } from "#/features/design/state/clipboard-atoms";
import {
  activeCommentAtom,
  activeCommentIterationIdAtom,
  commentDraftAtom,
  draggingIdAtom,
} from "#/features/design/state/comment-atoms";
import {
  draggingImageIdAtom,
  pipelineStagesAtom,
  rubberBandAtom,
  selectedIdsAtom,
  showGitHashAtom,
  showLibraryAtom,
  showResetConfirmAtom,
  spaceHeldAtom,
  toolModeAtom,
} from "#/features/design/state/generation-atoms";
import { canvasImagesAtom, hydrateImages } from "#/features/design/state/images-atoms";
import { SummaryList } from "#/features/design/ui/summary-list";
import { ModeSidebar } from "#/features/mode-sidebar";
import {
  showTutorialAtom,
  showWelcomeAtom,
  WelcomeModal,
  SettingsTourView,
  currentTourStepIdAtom,
} from "#/features/onboarding";
import { deriveProviderFields } from "#/features/settings/lib/derive-provider-fields";
import { isOwnKeyAtom, loadedAtom, settingsAtom } from "#/features/settings/state/settings-atoms";
import { SettingsDialog } from "#/features/settings/ui/settings-dialog";
import { exportCanvas, openImportDialog } from "#/lib/export";
import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import { useMountEffect } from "#/shared/utils/use-mount-effect";
import { ErrorBoundary } from "#/widgets/error-boundary";
import { useKeyboardShortcuts } from "#/widgets/keyboard-shortcuts";
import { PromptBar, PromptLibrary } from "#/widgets/prompt-bar";
import { Toolbar } from "#/widgets/toolbar";

const CommentInput = lazy(() => import("#/features/comments/ui/comment-input"));
const CommentThread = lazy(() => import("#/features/comments/ui/comment-thread"));
const FeedbackModal = lazy(() => import("#/features/feedback/ui/feedback-modal"));
const TutorialTour = lazy(() =>
  import("#/features/onboarding").then((m) => ({ default: m.TutorialTour })),
);

export default function Home() {
  return (
    <CanvasProvider>
      <HomeInner />
    </CanvasProvider>
  );
}

function HomeInner() {
  const canvas = useCanvas();
  const [settings, setSettings] = useAtom(settingsAtom);
  const isOwnKey = useAtomValue(isOwnKeyAtom);
  const loaded = useAtomValue(loadedAtom);

  useKeyboardShortcuts();

  const [groups, setGroups] = useAtom(groupsAtom);
  const resetSession = useSetAtom(resetSessionAtom);
  const [canvasImages, setCanvasImages] = useAtom(canvasImagesAtom);

  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [rubberBand, setRubberBand] = useAtom(rubberBandAtom);
  const [draggingId, setDraggingId] = useAtom(draggingIdAtom);
  const [draggingImageId, setDraggingImageId] = useAtom(draggingImageIdAtom);
  const spaceHeld = useAtomValue(spaceHeldAtom);
  const pipelineStages = useAtomValue(pipelineStagesAtom);
  const clipboard = useAtomValue(clipboardAtom);
  const setCommentDraft = useSetAtom(commentDraftAtom);
  const setActiveComment = useSetAtom(activeCommentAtom);
  const setActiveCommentIterationId = useSetAtom(activeCommentIterationIdAtom);

  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );

  const handleImageDrop = useCallback(
    (files: File[], dropX?: number, dropY?: number) => {
      files.forEach((file, idx) => {
        if (!file.type.startsWith("image/")) {
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxDim = 1024;
            const apiScale = Math.min(maxDim / Math.max(img.width, img.height), 1);
            const apiCanvas = document.createElement("canvas");
            apiCanvas.width = img.width * apiScale;
            apiCanvas.height = img.height * apiScale;
            const apiCtx = apiCanvas.getContext("2d")!;
            apiCtx.drawImage(img, 0, 0, apiCanvas.width, apiCanvas.height);
            const compressedDataUrl = apiCanvas.toDataURL("image/jpeg", 0.7);

            const thumbScale = Math.min(128 / img.width, 128 / img.height, 1);
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = img.width * thumbScale;
            thumbCanvas.height = img.height * thumbScale;
            const thumbCtx = thumbCanvas.getContext("2d")!;
            thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);

            const cx =
              dropX !== undefined ? (dropX - canvas.offset.x) / canvas.scale : 100 + idx * 220;
            const cy = dropY !== undefined ? (dropY - canvas.offset.y) / canvas.scale : 100;

            const displayScale = Math.min(200 / img.width, 1);

            setCanvasImages((prev) => [
              ...prev,
              {
                dataUrl: compressedDataUrl,
                height: img.height * displayScale,
                id: `img-${Date.now()}-${idx}`,
                name: file.name,
                position: { x: cx, y: cy },
                thumbnail,
                width: img.width * displayScale,
              },
            ]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [canvas.offset.x, canvas.offset.y, canvas.scale, setCanvasImages],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const rpc = (
        window as unknown as {
          __electrobun?: { rpc?: { request?: Record<string, (args: unknown) => void> } };
        }
      ).__electrobun?.rpc?.request;
      if (rpc && typeof rpc.contextMenu__show === "function") {
        rpc.contextMenu__show({
          selectedCount: selectedIds.size,
          hasClipboardContent: clipboard !== null,
          totalFrames: groups.length,
        });
      }
    },
    [selectedIds, clipboard, groups],
  );

  useMountEffect(() => {
    hydrateGroups(setGroups);
  });
  useMountEffect(() => {
    hydrateImages(setCanvasImages);
  });

  const [showResetConfirm, setShowResetConfirm] = useAtom(showResetConfirmAtom);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useAtom(showWelcomeAtom);
  const [showTutorial, setShowTutorial] = useAtom(showTutorialAtom);
  const [showGitHash, setShowGitHash] = useAtom(showGitHashAtom);
  const [showLibrary, setShowLibrary] = useAtom(showLibraryAtom);
  const [toolMode, setToolMode] = useAtom(toolModeAtom);
  const currentTourStepId = useAtomValue(currentTourStepIdAtom);
  const isSettingsTourStep =
    currentTourStepId === "provider-setup" ||
    currentTourStepId === "add-provider" ||
    currentTourStepId === "unsplash-key";

  useMountEffect(() => {
    setShowGitHash(new URLSearchParams(window.location.search).has("devMode"));
  });

  useMountEffect(() => {
    if (new URLSearchParams(window.location.search).get("quickMode") === "true") {
      setSettings((prev) => ({ ...prev, quickMode: true }));
    }
  });

  useMountEffect(() => {
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handler, { passive: false });
    return () => document.removeEventListener("wheel", handler);
  });

  useMountEffect(() => {
    const stored = localStorage.getItem("calca-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.onboardingCompleted === true) return;
      } catch {}
    }
    setShowWelcome(true);
  });

  useMountEffect(() => {
    if (new URLSearchParams(window.location.search).has("tour")) {
      setShowTutorial(true);
    }
  });

  useEffect(() => {
    if (isSettingsTourStep && showSettings) {
      setShowSettings(false);
    }
  }, [isSettingsTourStep, showSettings, setShowSettings]);

  const pipeline = useGenerationPipeline(canvas);
  const commentHandlers = useCommentHandlers(pipeline.handleRevision);

  const handleExportDesign = useCallback(() => {
    const startTime = Date.now();
    exportCanvas(groups);
    const frameCount = groups.reduce((acc, g) => acc + g.iterations.length, 0);
    trackExportComplete("svg", frameCount, Date.now() - startTime);
  }, [groups]);

  const handleImportDesign = useCallback(() => {
    openImportDialog((importedGroups) => {
      setGroups(importedGroups);
    });
  }, [setGroups]);

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none">
      <ErrorBoundary category={["calca", "web", "features", "canvas"]}>
        <CanvasArea
          canvas={canvas}
          groups={groups}
          onGroupsChange={setGroups}
          canvasImages={canvasImages}
          onCanvasImagesChange={setCanvasImages}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          toolMode={toolMode}
          spaceHeld={spaceHeld}
          rubberBand={rubberBand}
          setRubberBand={setRubberBand}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          draggingImageId={draggingImageId}
          setDraggingImageId={setDraggingImageId}
          pipelineStages={pipelineStages}
          onAddComment={setCommentDraft}
          onClickComment={(comment, iterationId) => {
            setActiveComment((prev) => (prev?.id === comment.id ? null : comment));
            setActiveCommentIterationId(comment ? iterationId : null);
          }}
          onImageDrop={handleImageDrop}
          onContextMenu={handleContextMenu}
          emptyTitle={m.canvas.emptyTitle()}
          emptyDescription={m.canvas.emptyDescription()}
          toolbar={
            selectedIds.size === 1 ? (
              <ContextToolbar
                onRemix={pipeline.handleRemix}
                apiKey={derived.apiKey || undefined}
                model={derived.model}
                providerType={derived.providerType || undefined}
                baseURL={derived.baseURL || undefined}
              />
            ) : null
          }
        />
      </ErrorBoundary>

      <Toolbar
        onNewSession={() => setShowResetConfirm(true)}
        onExport={handleExportDesign}
        onImport={handleImportDesign}
        isOwnKey={isOwnKey}
        model={settings.model}
        providers={settings.providers}
        hasFrames={groups.length > 0}
      />

      <ModeSidebar mode={toolMode} onModeChange={setToolMode} />

      <CanvasHUD
        scale={canvas.scale}
        offset={canvas.offset}
        onZoomIn={canvas.zoomIn}
        onZoomOut={canvas.zoomOut}
        onResetView={canvas.resetView}
      />

      <PromptBar
        onSubmit={pipeline.handleGenerate}
        onRemix={pipeline.handleRemix}
        isGenerating={pipeline.isGenerating}
        genStatus={pipeline.genStatus}
        onCancel={() => pipeline.abortRef.current?.abort()}
      />

      {showGitHash && (
        <div className="fixed bottom-2 left-2 z-40 text-[9px] font-mono text-gray-400 bg-black/5 backdrop-blur-sm px-2 py-1 rounded-md select-all">
          {import.meta.env.VITE_GIT_HASH}
        </div>
      )}

      <ErrorBoundary category={["calca", "web", "features", "comments"]}>
        <Suspense fallback={null}>
          {commentHandlers.commentDraft && (
            <CommentInput
              position={{
                screenX: commentHandlers.commentDraft.screenX,
                screenY: commentHandlers.commentDraft.screenY,
              }}
              onSubmit={commentHandlers.handleCommentSubmit}
              onCancel={() => commentHandlers.setCommentDraft(null)}
            />
          )}

          {commentHandlers.activeComment && (
            <CommentThread
              comment={commentHandlers.activeComment}
              onClose={() => {
                commentHandlers.setActiveComment(null);
                commentHandlers.setActiveCommentIterationId(null);
              }}
              onReply={commentHandlers.handleCommentReply}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <PromptLibrary
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onUsePrompt={(prompt) => {
          setShowLibrary(false);
          pipeline.handleGenerate(prompt);
        }}
      />

      {isSettingsTourStep && <SettingsTourView />}

      {showSettings && (
        <ErrorBoundary category={["calca", "web", "features", "settings"]}>
          <Suspense fallback={null}>
            <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
          </Suspense>
        </ErrorBoundary>
      )}

      <Suspense fallback={null}>
        <FeedbackModal />
      </Suspense>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] p-8 w-[380px] max-w-[90vw] text-center">
            <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
              {m.dialog.resetTitle()}
            </h3>
            <p className="text-[13px] text-gray-500 mb-6">{m.dialog.resetDescription()}</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  resetSession();
                  canvas.resetView();
                  setShowResetConfirm(false);
                }}
              >
                Clear Canvas
              </Button>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary category={["calca", "web", "features", "onboarding"]}>
        <Suspense fallback={null}>
          {showWelcome && (
            <WelcomeModal
              open={showWelcome}
              onTakeTour={() => {
                setShowWelcome(false);
                setShowTutorial(true);
              }}
              onSkip={() => {
                setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
                setShowWelcome(false);
              }}
            />
          )}

          {showTutorial && (
            <TutorialTour
              onComplete={() => {
                setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
                setShowTutorial(false);
              }}
              hasFrames={
                groups.length > 0 &&
                groups.some((g) => g.iterations.some((i) => !i.isLoading && i.html))
              }
            />
          )}
        </Suspense>
      </ErrorBoundary>

      {(!isOwnKey || !settings.model) && !showWelcome && (
        <OnboardingBanner onClick={() => setShowSettings(true)} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
