import { Textarea,  TextareaProps } from "@mantine/core";
import React from "react";

interface Props extends TextareaProps {
  width?: string;
}

export const CustomTextarea = ({
  width,
  ...props
}: Props) => {
  return (
    <Textarea
      {...props}
      classNames={{
        input: `border placeholder:!text-sm placeholder:!text-grey-400 focus:border-primary border-[#D0D5DD] !py-2 resize-none !px-4 ${
          props?.leftSection ? "!pl-8" : "!pl-4"
        } !rounded-lg ${width}`,
      }}
    />
  );
};
