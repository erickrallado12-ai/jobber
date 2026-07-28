"""Loads ``mexico.json`` at import time, enriches with common city aliases,
and exposes a fast search used by the ``/api/v1/locations`` endpoint.
"""

from __future__ import annotations

import json
import pathlib
import unicodedata
from dataclasses import dataclass

_DATA_PATH = pathlib.Path(__file__).parent / "mexico.json"

_CITY_ALIASES: dict[str, tuple[str, str]] = {
    "cancun": ("Benito Juárez", "Quintana Roo"),
    "cancún": ("Benito Juárez", "Quintana Roo"),
    "playa del carmen": ("Solidaridad", "Quintana Roo"),
    "tulum": ("Tulum", "Quintana Roo"),
    "cozumel": ("Cozumel", "Quintana Roo"),
    "san miguel de allende": ("San Miguel de Allende", "Guanajuato"),
    "san jose del cabo": ("Los Cabos", "Baja California Sur"),
    " cabo ": ("Los Cabos", "Baja California Sur"),
    "puerto vallarta": ("Puerto Vallarta", "Jalisco"),
    "valle de bravo": ("Valle de Bravo", "México"),
    "huatulco": ("Santa María Huatulco", "Oaxaca"),
    "acapulco": ("Acapulco de Juárez", "Guerrero"),
    "guanajuato": ("Guanajuato", "Guanajuato"),
    "toluca": ("Toluca", "México"),
    "leon": ("León", "Guanajuato"),
    "león": ("León", "Guanajuato"),
    "merida": ("Mérida", "Yucatán"),
    "mérida": ("Mérida", "Yucatán"),
    "oaxaca": ("Oaxaca de Juárez", "Oaxaca"),
    "puebla": ("Puebla", "Puebla"),
    "tlaxcala": ("Tlaxcala de Xicohténcatl", "Tlaxcala"),
    "chetumal": ("Chetumal", "Quintana Roo"),
    "campeche": ("Campeche", "Campeche"),
    "la paz": ("La Paz", "Baja California Sur"),
    "cuernavaca": ("Cuernavaca", "Morelos"),
    "veracruz": ("Veracruz", "Veracruz de Ignacio de la Llave"),
    "quintana roo": ("Benito Juárez", "Quintana Roo"),
}


@dataclass(frozen=True, slots=True)
class Location:
    clave: str
    nombre: str
    state_clave: str
    state_nombre: str


_locations: list[Location] = []
_by_clave: dict[str, Location] = {}
_alias_locations: list[Location] = []


def _strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _find_municipality(nombre: str, state: str) -> Location | None:
    n = _strip_accents(nombre.lower())
    s = _strip_accents(state.lower())
    for loc in _locations:
        if _strip_accents(loc.nombre.lower()) == n and _strip_accents(loc.state_nombre.lower()) == s:
            return loc
    return None


def _load() -> list[Location]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    locs: list[Location] = []
    for state in raw:
        s_clave = state["clave"]
        s_name = state["nombre"]
        for muni in state.get("municipios", []):
            locs.append(
                Location(
                    clave=muni["clave"],
                    nombre=muni["nombre"],
                    state_clave=s_clave,
                    state_nombre=s_name,
                )
            )
    return locs


def _build_aliases() -> list[Location]:
    aliases: list[Location] = []
    for alias_name, (muni_name, state_name) in _CITY_ALIASES.items():
        real = _find_municipality(muni_name, state_name)
        if real:
            aliases.append(
                Location(
                    clave=f"alias_{alias_name.strip()}",
                    nombre=alias_name.strip().title(),
                    state_clave=real.state_clave,
                    state_nombre=real.state_nombre,
                )
            )
    return aliases


_locations = _load()
_by_clave = {loc.clave: loc for loc in _locations}
_alias_locations = _build_aliases()


def search_locations(query: str, limit: int = 20) -> list[Location]:
    q = query.lower().strip()
    if not q:
        return []

    q_norm = _strip_accents(q)

    prefix_hits: list[Location] = []
    substring_hits: list[Location] = []
    seen: set[str] = set()

    all_entries = _locations + _alias_locations

    for loc in all_entries:
        dedup_key = f"{loc.state_nombre}|{_strip_accents(loc.nombre.lower())}"
        if dedup_key in seen:
            continue

        muni_norm = _strip_accents(loc.nombre.lower())
        state_norm = _strip_accents(loc.state_nombre.lower())

        if muni_norm.startswith(q_norm) or state_norm.startswith(q_norm):
            prefix_hits.append(loc)
            seen.add(dedup_key)
        elif q_norm in muni_norm or q_norm in state_norm:
            substring_hits.append(loc)
            seen.add(dedup_key)

        if len(seen) >= limit * 3:
            break

    results = prefix_hits + substring_hits
    results.sort(key=lambda l: (_strip_accents(l.nombre.lower())))
    return results[:limit]


def get_location(clave: str) -> Location | None:
    return _by_clave.get(clave)
