import { Select, SelectProps } from "@mantine/core";
import React from "react";

interface Props extends SelectProps {
  width?: string;
  height?: string;
}

export const CustomSelect = ({
  width,
  height,
  ...props
}: Props) => {
  return (
    <Select
      {...props}
      classNames={{
        input: `${height ?? "!h-11"} border placeholder:!text-sm placeholder:!text-grey-400 focus:border-primary border-[#D0D5DD] !px-4 ${
          props?.leftSection ? "!pl-8" : "!pl-4"
        } !rounded-lg ${width}`,
      }}
    />
  );
};
