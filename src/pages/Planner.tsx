import AutocompleteSearch from "@/components/SearchBar";

export default function Planner() {
    return (
        <div className="space-y-6">

            <div>
                <h1
                className="text-4xl font-bold"
                style={{
                fontFamily: "Bahnschrift, sans-serif",
                color: "#56A58B"}}
                >
                Module Planner
                </h1>
            </div>

            <div className= "w-full max-w-4xl mx-auto mt-6">
                <AutocompleteSearch />
            </div>

            <div>
                <h2>Planned Schedule</h2>
                {/* To build and drop a <TimetableGrid /> component here */}
            </div>

        </div>
    );
}










