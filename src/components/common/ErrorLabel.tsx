const ErrorLabel = ({ message }: { message: string }) => {
  return (
    <span className="label-text-alt text-red-800 block text-left text-sm mt-1">
      {message}
    </span>
  );
};

export default ErrorLabel;
