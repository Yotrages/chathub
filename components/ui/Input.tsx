import React, { RefObject } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { FaSearch } from "react-icons/fa";

interface InputProps {
  width?: string;
  height?: string;
  py?: string;
  px?: string;
  border?: string;
  type?: React.HTMLInputTypeAttribute;
  max_width?: string;
  placeholder: string;
  label?: string;
  border_radius?: string;
  left_content?: boolean;
  gap?: string;
  right_content?: boolean;
  register?: UseFormRegisterReturn<any>;
  icon?: React.ReactNode
  readyMade?: boolean
  className?: string
  value?: any
  autoFocus?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  maxLength?: number;
  ref?: RefObject<HTMLInputElement | null>
}

export const Input = ({
  width = "384px",
  height,
  py = "12px",
  px = "12px",
  border = "1px solid #d1d5db",
  type = "text",
  placeholder,
  label,
  border_radius = "8px",
  register,
  readyMade,
  icon,
  className,
  value,
  onBlur,
  onChange,
  onFocus,
  disabled,
  maxLength,
  ref,
  onKeyPress,
  ...props
}: InputProps) => {
  return (
    <div className={`flex ${className} flex-col gap-1 items-start w-full`}>
      <label
        htmlFor={label}
        id={label}
        className="text-black font-semibold text-base"
      >
        {label}
      </label>
      {props.left_content ? (
        readyMade ? (
           <div className="flex relative">
          <span>
            <FaSearch className="absolute top-4 left-3" />
          </span>
          <input
          ref={ref}
          maxLength={maxLength}
          disabled={disabled}
          onKeyPress={onKeyPress}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
            type={type}
            value={value}
            style={{
              width: width ?? "100%",
              paddingBlock: py,
              paddingInline: px,
              border: border,
              height: height,
              maxWidth: props.max_width,
              borderRadius: border_radius,
              paddingLeft: props.left_content ? "10px" : px,
              paddingRight: props.right_content ? "10px" : px,
            }}
            placeholder={placeholder}
            className={`focus:outline-none`}
            {...register}
          />
        </div>
        ) : (
          <div className="flex relative">
          <span className="absolute top-4 left-3">
            {icon}
          </span>
          <input
          ref={ref}
          maxLength={maxLength}
          disabled={disabled}
           onChange={onChange}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          autoFocus={props.autoFocus}
            type={type}
            value={value}
            style={{
              width: width ?? "100%",
              paddingBlock: py,
              paddingInline: px,
              border: border,
              height: height,
              maxWidth: props.max_width,
              borderRadius: border_radius,
              paddingLeft: props.left_content ? "35px" : px,
              paddingRight: props.right_content ? "20px" : px,
            }}
            placeholder={placeholder}
            className={`focus:outline-none`}
            {...register}
          />
        </div>
        )
      ) : props.right_content ? (
        readyMade ? (
          <div className="flex relative">
          <input
          ref={ref}
          maxLength={maxLength}
          disabled={disabled}
           onChange={onChange}
           onKeyPress={onKeyPress}
          onBlur={onBlur}
          onFocus={onFocus}
            type={type}
            style={{
              width: width ?? "100%",
              paddingBlock: py,
              paddingInline: px,
              border: border,
              height: height,
              maxWidth: props.max_width,
              borderRadius: border_radius,
            }}
            placeholder={placeholder}
            className="focus:outline-none"
            {...register}
          />
          <FaSearch className="absolute top-4 right-5" />
        </div>
        ) : (
          icon
        )
      ) : (
        <input
        ref={ref}
        maxLength={maxLength}
        disabled={disabled}
         onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          type={type}
          onKeyPress={onKeyPress}
          value={value}
          style={{
            width: width ?? "100%",
            paddingBlock: py,
            paddingInline: px,
            border: border,
            height: height,
            maxWidth: props.max_width,
            borderRadius: border_radius,
          }}
          placeholder={placeholder}
          className="focus:outline-none"
          {...register}
        />
      )}
    </div>
  );
};

export default Input;
