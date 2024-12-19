import { useForm } from "react-hook-form";

const Join = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <div className="w-full flex flex-col mx-auto items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="my-4">
          <label className="input input-bordered flex items-center w-96">
            <input
              type="text"
              {...register("gameAddress", {
                required: true,
                minLength: 42,
                maxLength: 42,
                pattern: /^0x[a-fA-F0-9]{40}$/,
              })}
              className="grow"
              placeholder="Game Address"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!isValid}
          className="btn btn-primary mt-4 w-96"
        >
          Join
        </button>
      </form>
    </div>
  );
};

export default Join;
