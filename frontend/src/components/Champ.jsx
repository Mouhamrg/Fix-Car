export default function Champ({
  label,
  name,
  type = "text",
  value,
  onChange,
  erreur,
  required = false,
  as = "input",
  options = [],
  aide,
  ...reste
}) {
  return (
    <div className={`champ ${erreur ? "champ--erreur" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </label>
      {as === "select" ? (
        <select id={name} name={name} value={value} onChange={onChange} {...reste}>
          {options.map((option) => (
            <option key={option.valeur} value={option.valeur}>
              {option.libelle}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          {...reste}
        />
      )}
      {aide && !erreur && <span className="texte-aide">{aide}</span>}
      {erreur && <span className="message-erreur-champ">{erreur}</span>}
    </div>
  );
}
