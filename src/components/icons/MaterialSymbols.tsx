import React from 'react';
import type { LucideProps } from 'lucide-react';

export type MaterialSymbolIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>;

function createSymbol(pathData: string, displayName: string): MaterialSymbolIcon {
  const IconComponent = React.forwardRef<SVGSVGElement, LucideProps>(
    ({ size = 24, color, className = '', style = {}, ...props }, ref) => {
      return (
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 -960 960 960"
          fill={color || 'currentColor'}
          className={className}
          style={style}
          aria-hidden="true"
          {...props}
        >
          <path d={pathData} />
        </svg>
      );
    }
  );
  IconComponent.displayName = displayName;
  return IconComponent as MaterialSymbolIcon;
}

export function createSvgIcon(
  viewBox: string,
  renderContent: (props: LucideProps) => React.ReactNode,
  displayName: string
): MaterialSymbolIcon {
  const IconComponent = React.forwardRef<SVGSVGElement, LucideProps>(
    ({ size = 24, color, className = '', style = {}, ...props }, ref) => {
      return (
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox={viewBox}
          fill={color || 'currentColor'}
          className={className}
          style={style}
          aria-hidden="true"
          {...props}
        >
          {renderContent({ size, color, className, style, ...props })}
        </svg>
      );
    }
  );
  IconComponent.displayName = displayName;
  return IconComponent as MaterialSymbolIcon;
}

// 1. Home App Logo
export const HomeAppLogoIcon = createSymbol(
  'M480-427ZM240-120q-50 0-85-35t-35-85v-240q0-24 9-46t26-39l240-240q17-18 39.5-26.5T480-840q23 0 45 8.5t40 26.5l240 240q17 17 26 39t9 46v240q0 50-35 85t-85 35H240Zm0-80h480q17 0 28.5-11.5T760-240v-240q0-8-3-15t-9-13L595-662l-59 58 144 144v180H280v-180l258-258-30-30q-8-8-15.5-10t-12.5-2q-5 0-12.5 2T452-748L212-508q-6 6-9 13t-3 15v240q0 17 11.5 28.5T240-200Zm120-160h240v-67L480-547 360-427v67Z',
  'HomeAppLogoIcon'
);

// 2. Exercise (Dumbbell tilted 45°)
export const ExerciseIcon = createSymbol(
  'm826-585-56-56 30-31-128-128-31 30-57-57 30-31q23-23 57-22.5t57 23.5l129 129q23 23 23 56.5T857-615l-31 30ZM346-104q-23 23-56.5 23T233-104L104-233q-23-23-23-56.5t23-56.5l30-30 57 57-31 30 129 129 30-31 57 57-30 30Zm397-336 57-57-303-303-57 57 303 303ZM463-160l57-58-302-302-58 57 303 303Zm-6-234 110-109-64-64-109 110 63 63Zm63 290q-23 23-57 23t-57-23L104-406q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l63 63 110-110-63-62q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l303 303q23 23 23 56.5T857-441l-57 57q-23 23-57 23t-57-23l-62-63-110 110 63 63q23 23 23 56.5T577-161l-57 57Z',
  'ExerciseIcon'
);

// 3. Flatware (Fork, Spoon, Knife)
export const FlatwareIcon = createSymbol(
  'M211.5-131.5Q200-143 200-160v-360q-33 0-56.5-23.5T120-600v-212q0-12 8-20t20-8q12 0 20 8t8 20v132h36v-132q0-12 8-20t20-8q12 0 20 8t8 20v132h36v-132q0-12 8-20t20-8q12 0 20 8t8 20v212q0 33-23.5 56.5T280-520v360q0 17-11.5 28.5T240-120q-17 0-28.5-11.5Zm280 0Q480-143 480-160v-364q-42-20-61-62.5T400-676q0-63 31.5-113.5T520-840q57 0 88.5 50.5T640-676q0 47-19 89.5T560-524v364q0 17-11.5 28.5T520-120q-17 0-28.5-11.5Zm200 0Q680-143 680-160v-633q0-17 11-28.5t28-11.5q45 0 83 48t38 105v200q0 17-11.5 28.5T800-440h-40v280q0 17-11.5 28.5T720-120q-17 0-28.5-11.5Z',
  'FlatwareIcon'
);

// 4. Book 2 (Closed book)
export const Book2Icon = createSymbol(
  'M240-347q14-7 29-10t31-3h20v-440h-20q-25 0-42.5 17.5T240-740v393Zm160-13h320v-440H400v440Zm-160 13v-453 453Zm60 267q-58 0-99-41t-41-99v-520q0-58 41-99t99-41h420q33 0 56.5 23.5T800-800v501q0 8-6.5 14.5T770-270q-14 7-22 20t-8 30q0 17 8 30.5t22 19.5q14 6 22 16.5t8 22.5v10q0 17-11.5 29T760-80H300Zm0-80h373q-6-14-9.5-28.5T660-220q0-16 3-31t10-29H300q-26 0-43 17.5T240-220q0 26 17 43t43 17Z',
  'Book2Icon'
);

// 5. Wallet (Card pocket wallet)
export const WalletIcon = createSymbol(
  'M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z',
  'WalletIcon'
);

// 6. Shopping Cart (Supermarket cart with wheels)
export const ShoppingCartIcon = createSymbol(
  'M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h440q17 0 28.5 11.5T760-320q0 17-11.5 28.5T720-280H280q-45 0-68-39.5t-2-78.5l54-98-144-304H80q-17 0-28.5-11.5T40-840q0-17 11.5-28.5T80-880h65q11 0 21 6t15 17l27 57Zm134 280h280-280Z',
  'ShoppingCartIcon'
);

// 7. List Alt Check (Checklist sheet with checkmark)
export const ListAltCheckIcon = createSymbol(
  'M200-200v-560 560-4.5 4.5Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v280q0 17-11.5 28.5T800-440q-17 0-28.5-11.5T760-480v-280H200v560h240q17 0 28.5 11.5T480-160q0 17-11.5 28.5T440-120H200Zm494-73 141-142q12-12 28.5-12t28.5 12q12 12 12 28.5T892-278L722-108q-12 12-28.5 12T665-108l-85-85q-11-12-11-28.5t12-28.5q12-12 28-12t28 12l57 57ZM348.5-451.5Q360-463 360-480t-11.5-28.5Q337-520 320-520t-28.5 11.5Q280-497 280-480t11.5 28.5Q303-440 320-440t28.5-11.5Zm0-160Q360-623 360-640t-11.5-28.5Q337-680 320-680t-28.5 11.5Q280-657 280-640t11.5 28.5Q303-600 320-600t28.5-11.5ZM640-440q17 0 28.5-11.5T680-480q0-17-11.5-28.5T640-520H480q-17 0-28.5 11.5T440-480q0 17 11.5 28.5T480-440h160Zm0-160q17 0 28.5-11.5T680-640q0-17-11.5-28.5T640-680H480q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600h160Z',
  'ListAltCheckIcon'
);

// 8. Laundry (T-shirt over water wave)
export const LaundryIcon = createSymbol(
  'm195-588 125-69v237q-21 2-41 6.5T240-401v-120l-41 22q-14 8-30 3.5T145-514L65-653q-8-14-3.5-30.5T80-708l199-115q12-7 25-12t27-5q14 0 24 8.5t15 21.5q14 38 36.5 64t73.5 26q51 0 73.5-26t36.5-64q5-13 15.5-21.5T630-840q14 0 26.5 5t24.5 12l199 115q14 8 18 24t-4 30l-79 140q-8 14-24 18.5t-30-3.5l-41-22v192l-63 55q-4 3-8 5.5t-9 4.5v-393l125 69 40-70-153-89q-24 49-70.5 78T480-640q-55 0-101.5-29T308-747l-154 89 41 70Zm285-52ZM160-215q-11-13-9.5-29.5T165-272l56-48q23-20 52.5-30.5T335-361q32 0 61 10.5t52 30.5l116 99q12 10 28.5 15.5T626-200q18 0 33.5-5t27.5-16l56-48q13-11 29.5-10t27.5 14q11 13 9.5 29.5T795-208l-56 48q-23 20-52 30t-61 10q-32 0-61.5-10T512-160l-116-99q-12-10-27.5-15.5T335-280q-17 0-33.5 5.5T273-259l-57 48q-13 11-29 10t-27-14Z',
  'LaundryIcon'
);

// 9. Expand All (Double chevron up and down)
export const ExpandAllIcon = createSymbol(
  'm480-194 155-155q12-12 28-12t28 12q12 12 12 28.5T691-292L537-137q-23 23-57 23t-57-23L268-292q-12-12-11.5-28.5T269-349q12-12 28.5-12t28.5 12l154 155Zm0-572L326-612q-12 12-28 11.5T270-612q-12-12-12.5-28.5T269-669l154-154q23-23 57-23t57 23l154 154q12 12 11.5 28.5T690-612q-12 11-28 11.5T634-612L480-766Z',
  'ExpandAllIcon'
);

// 10. Collapse Content (Inward facing corner brackets)
export const CollapseContentIcon = createSymbol(
  'M360-360H240q-17 0-28.5-11.5T200-400q0-17 11.5-28.5T240-440h160q17 0 28.5 11.5T440-400v160q0 17-11.5 28.5T400-200q-17 0-28.5-11.5T360-240v-120Zm240-240h120q17 0 28.5 11.5T760-560q0 17-11.5 28.5T720-520H560q-17 0-28.5-11.5T520-560v-160q0-17 11.5-28.5T560-760q17 0 28.5 11.5T600-720v120Z',
  'CollapseContentIcon'
);

// 11. Cloud Done (Rounded cloud with checkmark)
export const CloudDoneIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      <polyline points="9 13.5 11.5 16 15.5 11" strokeWidth="2.4" />
    </g>
  ),
  'CloudDoneIcon'
);

// 12. Cloud Off (Rounded cloud with diagonal slash)
export const CloudOffIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 2 20 20" strokeWidth="2.4" />
      <path d="M5.782 5.782A7 7 0 0 0 5.35 8.04C2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h12.17" />
      <path d="M21.53 15.82A5 5 0 0 0 19 11c-.44 0-.87.05-1.28.14" />
      <path d="M18.8 8.11A7 7 0 0 0 12 4c-1.8 0-3.46.68-4.72 1.8" />
    </g>
  ),
  'CloudOffIcon'
);

// 13. Lightbulb (Rounded lightbulb for Brain Dump)
export const LightbulbIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M9 16h6" strokeWidth="2.5" />
      <path d="M10.2 19a1.8 1.8 0 0 0 3.6 0" strokeWidth="2.2" fill="currentColor" />
    </g>
  ),
  'LightbulbIcon'
);

// 14. Target Check (Concentric circle target with checkmark)
export const TargetCheckIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5" />
      <path d="m9.5 12 2.5 2.5 5.5-5.5" strokeWidth="2.5" />
    </g>
  ),
  'TargetCheckIcon'
);

// 15. Rocket (Rocket with circular window and fins)
export const RocketIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c-3 3-4.5 6.5-4.5 11 0 2.5.5 4.5 1.5 6h6c1-1.5 1.5-3.5 1.5-6 0-4.5-1.5-8-4.5-11z" />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
      <path d="M7.5 13H5c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1h2.5" />
      <path d="M16.5 13H19c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-2.5" />
    </g>
  ),
  'RocketIcon'
);

// 16. Neurology (Curved brain lobes)
export const NeurologyIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16" />
      <path d="M12 5a3.5 3.5 0 0 0-3.5 3.5c0 .6.16 1.15.45 1.62A3.2 3.2 0 0 0 7 13a3.2 3.2 0 0 0 2 2.95V16a3 3 0 0 0 3 3" />
      <path d="M8.5 9.5a2 2 0 1 0 3.5 0" />
      <path d="M9 14a2 2 0 1 0 3 1.5" />
      <path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 .6-.16 1.15-.45 1.62A3.2 3.2 0 0 1 17 13a3.2 3.2 0 0 1-2 2.95V16a3 3 0 0 1-3 3" />
      <path d="M15.5 9.5a2 2 0 1 1-3.5 0" />
      <path d="M15 14a2 2 0 1 1-3 1.5" />
    </g>
  ),
  'NeurologyIcon'
);

// 17. Local Library (Person reading an open book)
export const LocalLibraryIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6.5" r="3" />
      <path d="M4 19.5c3.5-1.8 6-1.2 8 0 2-1.2 4.5-1.8 8 0V11c-3.5-1.8-6-1.2-8 0-2-1.2-4.5-1.8-8 0v8.5z" />
    </g>
  ),
  'LocalLibraryIcon'
);

// 18. Content Paste (Clipboard with top clip)
export const ContentPasteIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <circle cx="12" cy="4.2" r="0.9" fill="currentColor" />
    </g>
  ),
  'ContentPasteIcon'
);

// 19. Things To Do (Monument building with flag on top)
export const ThingsToDoIcon = createSvgIcon(
  '0 0 24 24',
  () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M6 16h12" />
      <path d="M8 16v-4" />
      <path d="M12 16v-4" />
      <path d="M16 16v-4" />
      <path d="M7 12a5 5 0 0 1 10 0" />
      <path d="M12 7V3" />
      <path d="M12 3h4l-1 2 1 2h-4" />
    </g>
  ),
  'ThingsToDoIcon'
);
