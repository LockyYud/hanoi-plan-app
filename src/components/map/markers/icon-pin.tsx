// "use client";

// import React from "react";
// import { cn } from "@/lib/utils";
// import { CategoryType } from "@prisma/client";
// import {
//     Coffee,
//     UtensilsCrossed,
//     Beer,
//     Building2,
//     Target,
//     Landmark,
// } from "lucide-react";

// interface IconPinProps {
//     readonly category: CategoryType;
//     readonly mood?: string;
//     readonly size?: "small" | "medium" | "large";
//     readonly className?: string;
//     readonly onClick?: () => void;
//     readonly isSelected?: boolean;
// }

// const sizeConfig = {
//     small: {
//         container: "w-10 h-10", // 40px
//         icon: "w-5 h-5", // 20px
//         iconPx: 20,
//         emoji: "text-lg",
//         border: "border-2",
//     },
//     medium: {
//         container: "w-12 h-12", // 48px
//         icon: "w-6 h-6", // 24px
//         iconPx: 24,
//         emoji: "text-xl",
//         border: "border-3",
//     },
//     large: {
//         container: "w-14 h-14", // 56px
//         icon: "w-7 h-7", // 28px
//         iconPx: 28,
//         emoji: "text-2xl",
//         border: "border-3",
//     },
// };

// export function IconPin({
//     mood,
//     size = "medium",
//     className,
//     onClick,
//     isSelected = false,
// }: IconPinProps) {
//     const config = sizeConfig[size];
//     const categoryInfo = categoryConfig[category];
//     const IconComponent = categoryInfo.icon;

//     const handleClick = (event: React.MouseEvent) => {
//         event.preventDefault();
//         event.stopPropagation();
//         onClick?.();
//     };

//     const handleKeyDown = (event: React.KeyboardEvent) => {
//         if (event.key === "Enter" || event.key === " ") {
//             event.preventDefault();
//             onClick?.();
//         }
//     };

//     return (
//         <button
//             type="button"
//             className={cn(
//                 "relative cursor-pointer transition-all duration-300 ease-out",
//                 "hover:scale-105 hover:z-20",
//                 "transform-gpu rounded-full",
//                 "border-0 p-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
//                 config.container,
//                 config.border,
//                 categoryInfo.bgColor,
//                 categoryInfo.borderColor,
//                 categoryInfo.hoverColor,
//                 isSelected
//                     ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
//                     : "",
//                 className
//             )}
//             onClick={handleClick}
//             onKeyDown={handleKeyDown}
//             style={{
//                 filter: isSelected
//                     ? "drop-shadow(0 6px 12px rgba(59, 130, 246, 0.3))"
//                     : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1))",
//             }}
//         >
//             {/* Icon container */}
//             <div
//                 className={cn(
//                     "w-full h-full rounded-full",
//                     "flex items-center justify-center",
//                     "transition-all duration-300"
//                 )}
//             >
//                 {/* Use mood emoji if available, otherwise use category emoji or Lucide icon */}
//                 {mood ? (
//                     <span className={cn("leading-none", config.emoji)}>
//                         {mood}
//                     </span>
//                 ) : (
//                     <>
//                         {/* Show emoji on small screens, Lucide icon on larger screens */}
//                         <span
//                             className={cn(
//                                 "leading-none sm:hidden",
//                                 config.emoji
//                             )}
//                         >
//                             {categoryInfo.emoji}
//                         </span>
//                         <IconComponent
//                             className={cn(
//                                 "hidden sm:block",
//                                 config.icon,
//                                 categoryInfo.iconColor
//                             )}
//                             size={config.iconPx}
//                         />
//                     </>
//                 )}
//             </div>

//             {/* Selection indicator ring */}
//             {isSelected && (
//                 <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse" />
//             )}

//             {/* Hover effect overlay */}
//             <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-200 rounded-full pointer-events-none" />
//         </button>
//     );
// }

// export default IconPin;
