import React from "react";
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
  children?: React.ReactNode
  readyMade?: boolean
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
  children,
  ...props
}: InputProps) => {
  return (
    <div className="flex flex-col gap-1 items-start w-full">
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
            type={type}
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
            className={`focus:outline-none ${
              props.left_content && "placeholder:pl-7"
            }`}
            {...register}
          />
        </div>
        ) : (
          children
        )
      ) : props.right_content ? (
        readyMade ? (
          <div className="flex relative">
          <input
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
          children
        )
      ) : (
        <input
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
      )}
    </div>
  );
};

export default Input;
