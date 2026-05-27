import AutocompleteSearch from "@/components/SearchBar";

export default function Planner() {
    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-3xl font-bold">Module Planner</h1>
                <p className="text-gray-500">Search for modules to plan your years.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <AutocompleteSearch />
            </div>

            <div>
                <h2>Planned Schedule</h2>
                {/* To build and drop a <TimetableGrid /> component here */}
            </div>

        </div>
    );
}










