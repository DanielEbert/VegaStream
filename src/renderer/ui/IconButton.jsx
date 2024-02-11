
export function IconButton({Icon, size, label, onClick}) {
    return (
        <button onClick={onClick} className="group relative justify-center flex">
            <span className="hidden group-hover:block absolute -top-10 whitespace-nowrap">{label}</span>
            <Icon size={size}/>
        </button>
    )
};
