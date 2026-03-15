export const Table = ({ children, className = '' }) => (
    <div className={`overflow-x-auto ${className}`}>
        <table className="w-full text-sm text-left text-gray-500 whitespace-nowrap">
            {children}
        </table>
    </div>
);

export const TableHead = ({ children }) => (
    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
        <tr>{children}</tr>
    </thead>
);

export const TableHeader = ({ children, className = '' }) => (
    <th scope="col" className={`px-6 py-3 font-semibold ${className}`}>
        {children}
    </th>
);

export const TableBody = ({ children }) => (
    <tbody className="divide-y divide-gray-100">
        {children}
    </tbody>
);

export const TableRow = ({ children, className = '' }) => (
    <tr className={`hover:bg-gray-50/50 transition-colors ${className}`}>
        {children}
    </tr>
);

export const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 ${className}`}>
        {children}
    </td>
);
