export default function NavHeader(props: { title?: string; children?: any }) {
  return (
    <header className="bg-white shadow-sm md:flex md:flex-row md:justify-around">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h1 className="text-lg leading-6 font-semibold text-gray-900">
          {props.title}
        </h1>
      </div>

      <div className="hidden sm:hidden md:flex items-center justify-end md:flex-1 lg:w-0 px-8">
        {props.children}
      </div>
    </header>
  );
}
