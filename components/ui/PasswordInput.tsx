import React, { useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface InputProps {
  width?: string;
  height?: string;
  py?: string;
  px?: string;
  border?: string;
  type?: React.HTMLInputTypeAttribute;
  max_width?: string;
  placeholder?: string;
  label?: string;
  border_radius?: string;
  gap?: string;
  register?: UseFormRegisterReturn<any>;
}

export const PasswordInput = ({
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
  ...props
}: InputProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1 items-start w-full">
      <label
        htmlFor={label}
        id={label}
        className="text-black font-semibold text-base"
      >
        {label}
      </label>
      <div className="flex relative">
        <input
          type={show ? type : "password"}
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
        <div
          onClick={() => setShow((prev) => !prev)}
          className="absolute cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center top-3 right-3 w-[30px] h-[30px] rounded-full bg-black/5"
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </div>
      </div>
    </div>
  );
};

export default PasswordInput;
