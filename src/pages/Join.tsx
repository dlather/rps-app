import { FieldValues, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const Join = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: FieldValues) => {
    navigate(`/play/${data.gameAddress}`);
  };

  return (
    <div className="w-full flex flex-col mx-auto items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="my-4">
          <label className="input input-bordered flex items-center w-96">
            <input
              type="text"
              {...register("gameAddress", {
                required: "Game address is required",
                minLength: {
                  value: 42,
                  message: "Game address is too short",
                },
                maxLength: {
                  value: 42,
                  message: "Game address is too long",
                },
                pattern: {
                  value: /^0x[a-fA-F0-9]{40}$/,
                  message: "Invalid game address",
                },
              })}
              className="grow"
              placeholder="Game Address"
            />
          </label>
          {errors.gameAddress && (
            <p className="text-white text-sm mt-1">
              {errors.gameAddress.message?.toString()}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary mt-4 w-96">
          Join
        </button>
      </form>
    </div>
  );
};

export default Join;
