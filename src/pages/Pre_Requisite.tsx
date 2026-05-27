import AutocompleteSearch from "@/components/SearchBar";

export default function Pre_Requisite() {
    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-3xl font-bold">Pre-Requisite</h1>
                <p className="text-gray-500">See pre-requisites of a module</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <AutocompleteSearch />
            </div>

            <div>
                <h2>Pre-Requisite</h2>
                {/* To build and drop a <TimetableGrid /> component here */}
            </div>

        </div>
    );
}