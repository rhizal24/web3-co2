import { Input } from "postcss";
import PropTypes from "prop-types";
import { forwardRef } from "react";

const InputWrapper = forwardRef(({ icon: Icon, placeholder = "Input", type = "text" }, ref) => {
  return (
    <div className="flex items-center overflow-hidden rounded-[50px] border-3 border-[#EFF4FE] text-center text-xl outline-0 max-sm:p-3 sm:p-4 sm:text-2xl lg:text-3xl">
      <Icon className="relative h-7 w-10 lg:h-10 lg:w-15" />
      <input ref={ref} type={type} placeholder={placeholder} className="outline-0 max-sm:w-[70%]" />
    </div>
  );
});

InputWrapper.displayName = "InputWrapper";

InputWrapper.propTypes = {
  icon: PropTypes.elementType.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
};

export default InputWrapper;
