// Maintains user-facing messaging in Portuguese per requirements

import {
  PROFILES,
  RANDOM_SUBTITLES,
  RANDOM_LOADING_MESSAGES,
  IRONIC_MESSAGES,
} from "./config";

type SessionState = {
  status?: "IDLE" | "RUNNING" | "COMPLETE" | "ERROR";
  results?: Record<string, number>;
  totals?: { left: number; right: number };
  totalProfiles?: number;
  lastError?: string | null;
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log(
    "[Popup] DOMContentLoaded triggered. UI Initialization running...",
  );

  // Set random subtitle header
  const subtitleEl = document.getElementById("app-subtitle");
  if (subtitleEl) {
    subtitleEl.innerText =
      RANDOM_SUBTITLES[Math.floor(Math.random() * RANDOM_SUBTITLES.length)];
  }

  // DOM element mapping
  const btnStart = document.getElementById("btn-start");
  const btnReset = document.getElementById("btn-reset");
  const btnErrorRetry = document.getElementById("btn-error-retry");
  const viewInitial = document.getElementById("view-initial");
  const viewLoading = document.getElementById("view-loading");
  const errorTextEl = document.getElementById("error-text");
  const progressFill = document.getElementById("progress-fill");
  const loadingTextEl = document.getElementById("loading-text");

  // Tracking elements corresponding to political metrics
  const progressLeftWingBar = document.getElementById("bar-left-wing");
  const progressRightWingBar = document.getElementById("bar-right-wing");
  const counterLeftWingTag = document.getElementById("count-left-wing");
  const counterRightWingTag = document.getElementById("count-right-wing");
  const resultSummaryCard = document.getElementById("result-summary-card");
  const resultHeadline = document.getElementById("result-headline");
  const resultIronyParagraph = document.getElementById("result-irony");
  const btnShare = document.getElementById("btn-share");

  console.log("[Popup] Fetching current analysis state from background...");
  const sessionConfig = await sendRuntimeMessage<SessionState>({
    type: "GET_ANALYSIS_STATE",
  });

  if (sessionConfig?.status === "COMPLETE") {
    console.log(
      "[Popup] Existing COMPLETED session found. Restoring metrics visually...",
    );
    renderAnalysisResults(sessionConfig.results, sessionConfig.totals);
  } else if (sessionConfig?.status === "RUNNING") {
    switchLayoutView("view-loading");
    syncLoadingProgress(sessionConfig);
  } else if (sessionConfig?.status === "ERROR") {
    renderErrorState(sessionConfig.lastError);
  } else {
    console.log(
      "[Popup] No previous completion state found. Showing initial setup view.",
    );
  }

  btnStart?.addEventListener("click", () => {
    console.log(
      "[Popup User Action] Start button interacted. Transitioning view to loader...",
    );
    switchLayoutView("view-loading");
    console.log(
      "[Popup User Action] Emitting START_ANALYSIS background intent...",
    );
    void sendRuntimeMessage({ type: "START_ANALYSIS" });
  });

  btnReset?.addEventListener("click", async () => {
    console.log(
      "[Popup User Action] Reset requested. Flushing session variables...",
    );
    await sendRuntimeMessage({ type: "RESET_ANALYSIS" });
    switchLayoutView("view-initial");
  });

  btnErrorRetry?.addEventListener("click", async () => {
    await sendRuntimeMessage({ type: "RESET_ANALYSIS" });
    switchLayoutView("view-initial");
  });

  btnShare?.addEventListener("click", () => {
    console.log("[Popup User Action] Gerar Imagem para Storie acionado.");
    generateShareImage();
  });

  // Event dispatcher capturing asynchronous completions
  chrome.runtime.onMessage.addListener((backgroundMessage) => {
    console.log(
      `[Popup Component] Receiver grabbed inner application message: ${backgroundMessage.type}`,
    );
    if (
      backgroundMessage.type === "ANALYSIS_PROGRESS" ||
      backgroundMessage.type === "ANALYSIS_STATE_CHANGED"
    ) {
      syncLoadingProgress(backgroundMessage.state);
    }

    if (backgroundMessage.type === "ANALYSIS_FINISHED") {
      console.log(
        "[Popup Component] Background analysis stream closed. Triggering UI rendering phase...",
      );
      renderAnalysisResults(
        backgroundMessage.state.results,
        backgroundMessage.state.totals,
      );
    }

    if (backgroundMessage.type === "ANALYSIS_ERROR") {
      renderErrorState(backgroundMessage.state.lastError);
    }
  });

  // Optimistic polling loop monitoring the data pipeline during loader periods
  let loaderTicks = 0;
  const uiPollingInterval = setInterval(async () => {
    if (viewLoading?.classList.contains("active")) {
      const state = await sendRuntimeMessage<SessionState>({
        type: "GET_ANALYSIS_STATE",
      });
      syncLoadingProgress(state);

      // Animate random loading subtext every ~2 seconds (4 cycles)
      if (loaderTicks % 4 === 0 && loadingTextEl) {
        loadingTextEl.innerText =
          RANDOM_LOADING_MESSAGES[
            Math.floor(Math.random() * RANDOM_LOADING_MESSAGES.length)
          ];
      }
      loaderTicks++;
    }
  }, 500);

  window.addEventListener("beforeunload", () => {
    clearInterval(uiPollingInterval);
  });

  /**
   * Layout manager hiding inactive panels and showing target screen frames
   */
  function switchLayoutView(activeViewId: string) {
    console.log(
      `[Popup Renderer] Switching displayed macro layout window to: ${activeViewId}`,
    );
    document
      .querySelectorAll(".view")
      .forEach((htmlSection) => htmlSection.classList.remove("active"));
    document.getElementById(activeViewId)?.classList.add("active");
  }

  function syncLoadingProgress(state?: {
    results?: Record<string, number>;
    totalProfiles?: number;
  }) {
    const retrievedProfilesCount = Object.keys(state?.results || {}).length;
    const totalProfiles = state?.totalProfiles || PROFILES.length;
    const progressPercentage =
      totalProfiles === 0 ? 0 : (retrievedProfilesCount / totalProfiles) * 100;

    console.log(
      `[Popup Poller] Active scraping progress: ${retrievedProfilesCount}/${totalProfiles} -> ${progressPercentage}%`,
    );

    if (progressFill) progressFill.style.width = `${progressPercentage}%`;
  }

  function sendRuntimeMessage<T>(message: { type: string }): Promise<T> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "[Popup] Runtime message failed:",
            chrome.runtime.lastError.message,
          );
          resolve({} as T);
          return;
        }

        resolve(response as T);
      });
    });
  }

  function renderErrorState(message?: string | null) {
    if (errorTextEl) {
      errorTextEl.innerText =
        message ||
        "Nao foi possivel concluir a analise. Verifique sua sessao no Instagram e tente novamente.";
    }
    switchLayoutView("view-error");
  }

  /**
   * Final logic rendering results and computing proportional irony
   * Note: We no longer need the raw `resultsMap` as `totalSums` natively aggregates sides.
   */
  function renderAnalysisResults(resultsMap: any, totalSums?: any) {
    console.log(
      "[Popup Renderer] Building analysis dashboard interface mappings...",
    );
    switchLayoutView("view-results");

    const leftWingScore = totalSums?.left || 0;
    const rightWingScore = totalSums?.right || 0;
    const combinedInteractivityTotal = leftWingScore + rightWingScore;

    console.log(
      `[Popup Computations] Left Wing Interaction Node Total: ${leftWingScore}. Right Wing Node Total: ${rightWingScore}`,
    );

    if (counterLeftWingTag)
      counterLeftWingTag.innerText = `${leftWingScore} amigos`;
    if (counterRightWingTag)
      counterRightWingTag.innerText = `${rightWingScore} amigos`;

    const dominantScore = Math.max(leftWingScore, rightWingScore);
    const dominantPercentage =
      combinedInteractivityTotal === 0
        ? 0
        : Math.round((dominantScore / combinedInteractivityTotal) * 100);
    const dominantSideLabel =
      leftWingScore === rightWingScore
        ? "equilibrados"
        : leftWingScore > rightWingScore
          ? "ESQUERDA"
          : "DIREITA";

    if (resultHeadline) {
      resultSummaryCard?.classList.remove(
        "left-dominant",
        "right-dominant",
        "balanced",
      );
      resultHeadline.classList.remove(
        "left-dominant",
        "right-dominant",
        "balanced",
      );
      resultHeadline.innerText =
        dominantSideLabel === "equilibrados"
          ? "Seus amigos tendem a ser 50% para cada lado"
          : `Seus amigos tendem a ser ${dominantPercentage}% para ${dominantSideLabel}`;

      if (dominantSideLabel === "ESQUERDA") {
        resultSummaryCard?.classList.add("left-dominant");
        resultHeadline.classList.add("left-dominant");
      } else if (dominantSideLabel === "DIREITA") {
        resultSummaryCard?.classList.add("right-dominant");
        resultHeadline.classList.add("right-dominant");
      } else {
        resultSummaryCard?.classList.add("balanced");
        resultHeadline.classList.add("balanced");
      }
    }

    // Asynchronous visual DOM transition hooks allowing CSS paints gracefully processing bar increments
    setTimeout(() => {
      console.log(
        "[Popup Renderer] Enacting animated CSS structural transition fills...",
      );
      if (combinedInteractivityTotal === 0) {
        if (progressLeftWingBar) progressLeftWingBar.style.width = "0%";
        if (progressRightWingBar) progressRightWingBar.style.width = "0%";
      } else {
        const dominatingFactor = Math.max(leftWingScore, rightWingScore);
        if (progressLeftWingBar)
          progressLeftWingBar.style.width = `${(leftWingScore / dominatingFactor) * 100}%`;
        if (progressRightWingBar)
          progressRightWingBar.style.width = `${(rightWingScore / dominatingFactor) * 100}%`;
      }
    }, 100);

    console.log(
      "[Popup Analyser] Calculating proportional irony bias based on network clustering ratios...",
    );
    let thematicCategoryKey: keyof typeof IRONIC_MESSAGES = "BALANCED";
    const computedRatio = leftWingScore / (rightWingScore || 1); // Avoids division by zero exceptions

    if (combinedInteractivityTotal === 0) {
      thematicCategoryKey = "EMPTY";
    } else if (computedRatio > 2) {
      thematicCategoryKey = "LEFT_DOMINANT";
    } else if (computedRatio < 0.5) {
      thematicCategoryKey = "RIGHT_DOMINANT";
    } else {
      thematicCategoryKey = "BALANCED";
    }

    console.log(
      `[Popup Analyser] User classified conceptually inside segment definition: ${thematicCategoryKey}`,
    );
    const categoricalMessages = IRONIC_MESSAGES[thematicCategoryKey];
    const isolatedRandomMessage =
      categoricalMessages[
        Math.floor(Math.random() * categoricalMessages.length)
      ];

    if (resultIronyParagraph) {
      resultIronyParagraph.innerText = isolatedRandomMessage;
      console.log(
        "[Popup Renderer] Irony message successfully injected onto view layout target paragraph.",
      );
    }
  }

  async function generateShareImage() {
    const leftLabel = counterLeftWingTag?.innerText || "0 amigos";
    const rightLabel = counterRightWingTag?.innerText || "0 amigos";
    const leftPercent = progressLeftWingBar?.style.width || "0%";
    const rightPercent = progressRightWingBar?.style.width || "0%";
    const headline =
      document.getElementById("result-headline")?.innerText || "Sua bolha é...";
    const ironyText =
      resultIronyParagraph?.innerText || "Compartilhe seu resultado!";
    const subtitle =
      document.getElementById("app-subtitle")?.innerText ||
      "Descubra quão fundo você está no seu cercadinho.";

    const storyWidth = 720;
    const storyHeight = 1280;
    const canvas = document.createElement("canvas");
    canvas.width = storyWidth;
    canvas.height = storyHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("[Popup Export] Canvas 2D indisponivel para exportacao.");
      alert("Não foi possível gerar a imagem do story. Tente novamente.");
      return;
    }

    const parsePercent = (value: string) => {
      const parsed = Number.parseFloat(value.replace("%", ""));
      if (Number.isNaN(parsed)) return 0;
      return Math.max(0, Math.min(parsed, 100));
    };

    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
    ) => {
      const safeRadius = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + safeRadius, y);
      ctx.lineTo(x + width - safeRadius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
      ctx.lineTo(x + width, y + height - safeRadius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - safeRadius,
        y + height,
      );
      ctx.lineTo(x + safeRadius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
      ctx.lineTo(x, y + safeRadius);
      ctx.quadraticCurveTo(x, y, x + safeRadius, y);
      ctx.closePath();
    };

    const fillRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      fillStyle: string | CanvasGradient,
    ) => {
      ctx.save();
      drawRoundedRect(x, y, width, height, radius);
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.restore();
    };

    const wrapText = (
      text: string,
      maxWidth: number,
      font: string,
      lineHeight: number,
    ) => {
      ctx.save();
      ctx.font = font;

      const words = text.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      ctx.restore();
      return { lines, height: lines.length * lineHeight };
    };

    const drawWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      font: string,
      color: string,
      lineHeight: number,
    ) => {
      const wrapped = wrapText(text, maxWidth, font, lineHeight);
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      for (const [index, line] of wrapped.lines.entries()) {
        ctx.fillText(line, x, y + index * lineHeight);
      }
      ctx.restore();
      return wrapped.height;
    };

    const downloadCanvasBlob = (blob: Blob | null) => {
      if (!blob) {
        console.error("[Popup Export] Canvas.toBlob retornou blob nulo.");
        alert("Não foi possível gerar a imagem do story. Tente novamente.");
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "minha-bolha-politica-story.png";
      link.click();
      URL.revokeObjectURL(downloadUrl);
    };

    const leftBarPercent = parsePercent(leftPercent);
    const rightBarPercent = parsePercent(rightPercent);
    const leftCount = Number.parseInt(leftLabel, 10) || 0;
    const rightCount = Number.parseInt(rightLabel, 10) || 0;
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);
    const readCssVar = (name: string, fallback: string) =>
      rootStyles.getPropertyValue(name).trim() || fallback;

    const colors = {
      background:
        bodyStyles.backgroundColor || readCssVar("--bg-color", "#121212"),
      panel: readCssVar("--panel-bg", "rgba(255, 255, 255, 0.03)"),
      glass: readCssVar("--glass", "rgba(255, 255, 255, 0.05)"),
      border: readCssVar("--border-color", "rgba(255, 255, 255, 0.10)"),
      text: readCssVar("--text", "#f5f5f7"),
      ironyText: readCssVar("--text-irony", "#ffffff"),
      muted: readCssVar("--text-muted", "#8e8e93"),
      primaryGradient: readCssVar(
        "--primary-gradient",
        "linear-gradient(to right, #e53e3e 0%, #e53e3e 85%, #f6ad55 100%)",
      ),
      secondaryGradient: readCssVar(
        "--secondary-gradient",
        "linear-gradient(to right, #ecc94b 0%, #ecc94b 85%, #48bb78 100%)",
      ),
    };

    const parseGradientStops = (gradient: string, fallback: string[]) => {
      const hexMatches = gradient.match(/#[0-9a-fA-F]{3,8}/g);
      if (!hexMatches || hexMatches.length < 2) return fallback;
      return [hexMatches[0], hexMatches[hexMatches.length - 1]];
    };

    const [leftStart, leftEnd] = parseGradientStops(colors.primaryGradient, [
      "#e53e3e",
      "#f6ad55",
    ]);
    const [rightStart, rightEnd] = parseGradientStops(
      colors.secondaryGradient,
      ["#ecc94b", "#48bb78"],
    );
    const dominantSide =
      leftCount === rightCount
        ? "equilibrada"
        : leftCount > rightCount
          ? "esquerda"
          : "direita";
    const dominantGradientColors =
      dominantSide === "esquerda"
        ? [leftStart, leftEnd]
        : dominantSide === "direita"
          ? [rightStart, rightEnd]
          : ["#9ca3af", "#d1d5db"];

    const containerX = 34;
    const containerY = 34;
    const containerWidth = storyWidth - 68;
    const horizontalPadding = containerX + 18;
    const contentWidth = containerWidth - 36;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, storyWidth, storyHeight);

    fillRoundedRect(
      containerX,
      containerY,
      containerWidth,
      storyHeight - 68,
      30,
      colors.background,
    );

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.text;
    ctx.font =
      "800 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("Minha Bolha Política", storyWidth / 2 - 20, 72);
    ctx.font =
      "500 34px -apple-system, BlinkMacSystemFont, 'Segoe UI Emoji', sans-serif";
    ctx.fillText("🫧", storyWidth / 2 + 216, 80);
    ctx.restore();

    drawWrappedText(
      subtitle,
      horizontalPadding + 24,
      142,
      contentWidth - 48,
      "500 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      colors.muted,
      34,
    );

    const headerCardY = 218;
    const headerCardHeight = 220;
    fillRoundedRect(
      horizontalPadding,
      headerCardY,
      contentWidth,
      headerCardHeight,
      30,
      colors.panel,
    );
    ctx.save();
    drawRoundedRect(
      horizontalPadding,
      headerCardY,
      contentWidth,
      headerCardHeight,
      30,
    );
    ctx.strokeStyle = colors.glass;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const drawBarSection = (
      label: string,
      count: string,
      percent: number,
      top: number,
      startColor: string,
      endColor: string,
    ) => {
      ctx.save();
      ctx.font =
        "700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = colors.muted;
      ctx.textBaseline = "top";
      ctx.fillText(label.toUpperCase(), horizontalPadding, top);

      ctx.font =
        "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const countWidth = ctx.measureText(count).width;
      ctx.fillStyle = colors.muted;
      ctx.fillText(
        count,
        horizontalPadding + contentWidth - countWidth,
        top + 96,
      );
      ctx.restore();

      const barY = top + 50;
      const barHeight = 24;
      fillRoundedRect(
        horizontalPadding,
        barY,
        contentWidth,
        barHeight,
        999,
        colors.glass,
      );

      if (percent > 0) {
        const fillGradient = ctx.createLinearGradient(
          horizontalPadding,
          barY,
          horizontalPadding + contentWidth,
          barY,
        );
        fillGradient.addColorStop(0, startColor);
        fillGradient.addColorStop(0.85, startColor);
        fillGradient.addColorStop(1, endColor);
        fillRoundedRect(
          horizontalPadding,
          barY,
          Math.max((contentWidth * percent) / 100, barHeight),
          barHeight,
          999,
          fillGradient,
        );
      }
    };

    drawBarSection(
      "Esquerda",
      leftLabel,
      leftBarPercent,
      580,
      leftStart,
      leftEnd,
    );
    drawBarSection(
      "Direita",
      rightLabel,
      rightBarPercent,
      760,
      rightStart,
      rightEnd,
    );

    drawWrappedText(
      ironyText,
      horizontalPadding + 40,
      headerCardY + 52,
      contentWidth - 80,
      "700 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      colors.ironyText,
      38,
    );

    const summaryCardY = 878;
    const summaryGradient = ctx.createLinearGradient(
      horizontalPadding,
      summaryCardY,
      horizontalPadding + contentWidth,
      summaryCardY,
    );
    summaryGradient.addColorStop(0, dominantGradientColors[0]);
    summaryGradient.addColorStop(1, dominantGradientColors[1]);
    fillRoundedRect(
      horizontalPadding,
      summaryCardY,
      contentWidth,
      116,
      28,
      dominantSide === "equilibrada" ? colors.panel : summaryGradient,
    );
    ctx.save();
    drawRoundedRect(horizontalPadding, summaryCardY, contentWidth, 116, 28);
    ctx.strokeStyle =
      dominantSide === "equilibrada"
        ? colors.glass
        : "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const summaryColor =
      dominantSide === "esquerda"
        ? "#ffffff"
        : dominantSide === "direita"
          ? "#1a1a1a"
          : colors.text;
    drawWrappedText(
      headline,
      horizontalPadding + 28,
      summaryCardY + 28,
      contentWidth - 56,
      "800 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      summaryColor,
      36,
    );

    ctx.save();
    ctx.font =
      "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.muted;
    ctx.textBaseline = "top";
    drawWrappedText(
      'Quer saber sua bolha? Procure por "Minha Bolha Política" e faça o seu teste.',
      horizontalPadding + 8,
      1046,
      contentWidth - 16,
      "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      colors.muted,
      28,
    );
    ctx.restore();

    try {
      canvas.toBlob(downloadCanvasBlob, "image/png");
    } catch (error) {
      console.error("[Popup Export] Falha ao converter canvas em blob.", error);
      alert("Não foi possível gerar a imagem do story. Tente novamente.");
    }
  }
});
