type Props = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
};

export default function TextArea({ name, label, value, required }: Props) {
  return (
    <div class="relative z-0 mt-8">
      <textarea
        name={name}
        class="block w-full bg-transparent border-0 ring-2 focus:ring-2 ring-gray-600 focus:ring-white rounded focus:outline-none peer"
        placeholder=" "
        required={required}
      >
        {value}
      </textarea>
      <label
        for={name}
        class="absolute text-gray-400 peer-focus:text-gray-600 font-semibold peer-placeholder-shown:font-normal origin-[0] top-2 -translate-y-10 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:translate-x-3 scale-[88%] peer-placeholder-shown:scale-100 transition -z-10"
      >
        {label}
      </label>
    </div>
  );
}
