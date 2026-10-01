/**
 * Document Picture-in-Picture (PiP) & Video PiP Utility System
 * Implements Floating Screen Transparency & Layering Specification.
 */

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
    };
  }
}

export function setupDocumentPipWindow(pipWindow: Window): void {
  if (!pipWindow || !pipWindow.document) return;

  // 1. Explicitly set root documentElement & body background to transparent
  pipWindow.document.documentElement.style.setProperty('background', 'transparent', 'important');
  pipWindow.document.documentElement.style.setProperty('background-color', 'transparent', 'important');
  pipWindow.document.body.style.setProperty('background', 'transparent', 'important');
  pipWindow.document.body.style.setProperty('background-color', 'transparent', 'important');
  pipWindow.document.body.classList.add('pip-active', 'floating-window-root');

  // 2. Inherit active project stylesheets and style elements
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.href) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pipWindow.document.head.appendChild(link);
        } else if (sheet.cssRules) {
          const style = pipWindow.document.createElement('style');
          Array.from(sheet.cssRules).forEach((rule) => {
            style.appendChild(pipWindow.document.createTextNode(rule.cssText));
          });
          pipWindow.document.head.appendChild(style);
        }
      } catch (e) {
        if (sheet.href) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pipWindow.document.head.appendChild(link);
        }
      }
    });
  } catch (err) {
    console.warn('[setupDocumentPipWindow] Stylesheet inheritance error:', err);
  }
}

/**
 * Opens a Document Picture-in-Picture floating window with transparent background
 * and injected application stylesheets.
 */
export async function openFloatingWindow(contentNode: HTMLElement): Promise<Window | void> {
  if (typeof window === 'undefined' || !window.documentPictureInPicture) {
    console.warn('Document Picture-in-Picture API is not supported in this browser.');
    return;
  }

  // Request floating window instance
  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: 360,
    height: 640,
  });

  const pipDoc = pipWindow.document;

  // Enforce body/root transparency
  pipDoc.documentElement.style.background = 'transparent';
  pipDoc.body.style.background = 'transparent';
  pipDoc.body.style.margin = '0';
  pipDoc.body.style.overflow = 'hidden';

  // Inject current application styles into the floating window
  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        const newStyle = pipDoc.createElement('style');
        Array.from(styleSheet.cssRules).forEach((rule) => {
          newStyle.appendChild(pipDoc.createTextNode(rule.cssText));
        });
        pipDoc.head.appendChild(newStyle);
      } else if (styleSheet.href) {
        const newLink = pipDoc.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = styleSheet.href;
        pipDoc.head.appendChild(newLink);
      }
    } catch (e) {
      console.error('Error copying stylesheet to PiP window:', e);
    }
  });

  // Attach target node
  pipDoc.body.appendChild(contentNode);
  return pipWindow;
}

/**
 * Toggles Video Picture-in-Picture mode with transparent background
 * and contain object-fitting to eliminate letterboxing padding.
 */
export async function enableVideoPiP(videoElement: HTMLVideoElement): Promise<void> {
  if (!videoElement) return;

  // Clear container styles prior to entering PiP mode
  videoElement.style.backgroundColor = 'transparent';
  videoElement.style.objectFit = 'contain';

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else if (document.pictureInPictureEnabled) {
    await videoElement.requestPictureInPicture();
  }
}

export default openFloatingWindow;
