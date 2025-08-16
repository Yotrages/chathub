import React, { ReactNode } from "react";
import { FaArrowAltCircleRight, FaFilter, FaSpinner } from "react-icons/fa";

interface ButtonProps {
  py: string;
  px: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  width: string;
  height: string;
  rightContent: boolean;
  type: "submit" | "reset" | "button";
  leftContent: boolean;
  gap: string;
  fullWidth: string;
  color: string;
  font: string;
  shadow: string;
  text_shadow: string;
  font_family: string;
  font_weight: string;
  background?: string;
  opacity: string;
  text: ReactNode;
  variant: "filled" | "white" | "orange" | "gray";
  border_radius: string;
  icon_Color: string;
  disabled: boolean;
  loading: boolean ;
  children: ReactNode;
  className: string
}

const buttonStyles = {
  filled: {
    bg: "#FFFFFF",
    borderColor: "#D1D5DB",
    color: "#374151",
    borderWidth: "1px",
    borderStyle: "solid",
  },
  white: {
    bg: "#EB5017",
    color: "#fff",
  },
  orange: {
    bg: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#F56630",
    color: "#0070f3",
  },
  gray: {
    bg: "none",
    backgroundImage:
      "linear-gradient(0deg, #F56630, #F56630),radial-gradient(100% 100% at 50% 0%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%)",
    color: "white",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#CD6B41",
  },
};
export const Button = ({
  py = "12px",
  px = "16px",
  color,
  font = "14px",
  children,
  font_family,
  font_weight = "600",
  fullWidth = "100%",
  gap = "4px",
  opacity,
  shadow,
  text_shadow,
  type = "button",
  leftContent,
  rightContent,
  height,
  width,
  onClick,
  variant = "filled",
  text,
  disabled,
  border_radius = "8px",
  ...props
}: Partial<ButtonProps>) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "gray" : buttonStyles[variant].bg,
        paddingBlock: py,
        paddingInline: px,
        width: width ?? "fit-content",
        height: height,
        boxShadow: shadow,
        textShadow: text_shadow,
        opacity: opacity,
        borderRadius: border_radius,
        maxWidth: fullWidth,
        gap: rightContent || leftContent ? gap : "0px",
        ...buttonStyles[variant],
      }}
      type={type}
      className={`flex justify-center ${disabled && "bg-gray-700"} items-center ${props.className}`}
    >
      {leftContent && (
        <FaArrowAltCircleRight
          style={{ color: props.icon_Color ?? buttonStyles[variant].color }}
        />
      )}
      <span
        style={{
          color: color ?? buttonStyles[variant].color,
          fontFamily: font_family,
          fontSize: font,
          fontWeight: font_weight,
        }}
      >
        {props.loading ? <FaSpinner className="animate-spin"/> : text}
      </span>
      {rightContent && (
        <FaFilter
          style={{ color: props.icon_Color ?? buttonStyles[variant].color }}
        />
      )}
      {children}
    </button>
  );
};

export default Button;
