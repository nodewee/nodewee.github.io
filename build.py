import json
from pathlib import Path
import hjson
import httpx

STATIC_BASE_URL = "https://static.mixin.city/"


def main():
    for pth in Path("pages").iterdir():
        if not pth.is_dir():
            continue
        page_name = pth.name
        page_data = merge_data(page_name)

        output_public_for_github_pages(page_name, page_data)
        output_public_for_city_space(page_name, page_data)


def output_public_for_github_pages(page_name, page_data):
    common_data = hjson.load(Path("pages").joinpath("common.hjson").open())
    # - overwrite meta.page_url
    page_data["page"]["meta"]["page_url"] = "/" + page_name

    # - build index.html
    html = build_index_html(page_name, page_data)

    # - insert analytics
    google_tag_id = common_data.get("analytics", {}).get("google_tag_id")
    if google_tag_id:
        html = insert_google_analytics(google_tag_id, html)

    # - write to public
    if page_name == "index":
        page_dest_dir = Path("public")
    else:
        page_dest_dir = Path("public").joinpath(page_name)
    page_dest_dir.mkdir(parents=True, exist_ok=True)
    page_dest_dir.joinpath("data.json").write_text(
        json.dumps(page_data, ensure_ascii=False)
    )
    page_dest_dir.joinpath("index.html").write_text(html)

    # - create .nojekyll
    if not Path("public").joinpath(".nojekyll").exists():
        Path("public").joinpath(".nojekyll").touch()


def output_public_for_city_space(page_name, page_data):
    if not page_data.get("city_space", {}).get("space_id"):
        return
    # - overwrite meta.page_url
    page_data["page"]["meta"]["page_url"] = "/" + page_data["city_space"]["space_id"]
    # - build index.html
    html = build_index_html(page_name, page_data)
    # - write to public
    page_dest_dir = Path("deploy-to-city-space/public").joinpath(
        page_data["city_space"]["space_id"]
    )
    page_dest_dir.mkdir(parents=True, exist_ok=True)
    page_dest_dir.joinpath("data.json").write_text(
        json.dumps(page_data, ensure_ascii=False)
    )
    page_dest_dir.joinpath("index.html").write_text(html)


def merge_data(page_name: str):
    # fill nested data
    srcfile = Path("pages").joinpath(page_name).joinpath("theme.hjson")
    d = hjson.load(srcfile.open())
    d = json.loads(hjson.dumpsJSON(d, for_json=True))  # convert to json
    merged = fill_nested_data(page_name, d)
    merged = fill_nested_data(page_name, merged)  # fill level 2 nested data

    # add city-space data
    city_space = {}
    # - user data
    file = Path("deploy-to-city-space").joinpath("config.hjson")
    if file.exists():
        d = hjson.load(file.open())
        user_id = d.get("user_id")
        if user_id:
            city_space["user_id"] = user_id
    # - space data
    file = Path("pages").joinpath(page_name).joinpath("city-space.hjson")
    if file.exists():
        d = hjson.load(file.open())
        d = json.loads(hjson.dumpsJSON(d, for_json=True))  # convert to json
        city_space.update(d)
    merged["city_space"] = city_space

    return merged


def fill_nested_data(page_name, data: any):
    if isinstance(data, dict):
        for key in data:
            data[key] = fill_nested_data(page_name, data[key])
    elif isinstance(data, list):
        for i, val in enumerate(data):
            data[i] = fill_nested_data(page_name, val)
    elif isinstance(data, str) and data.startswith("$") and data.endswith("$"):
        return get_nested_data(page_name, data.strip("$"))
    return data


def get_nested_data(page_name, var_name: str):
    arr = var_name.split(".")
    if arr[0] == "common":
        file = Path("pages").joinpath("common.hjson")
    else:
        file = Path("pages").joinpath(page_name).joinpath(arr[0] + ".hjson")
    if not file.exists():
        raise FileNotFoundError(
            f"File not found: {file}. page_name: {page_name}, var_name: {var_name}"
        )
    try:
        d = hjson.load(file.open())
    except Exception as e:
        print(f"File error: {file}")
        raise e

    d = json.loads(hjson.dumpsJSON(d, for_json=True))  # convert to json
    try:
        for key in arr[1:]:
            d = d[key]
    except KeyError:
        raise KeyError(
            f"Key not found: {key}. page_name: {page_name}, var_name: {var_name}"
        )
    except TypeError:
        raise TypeError(
            f"Type error: {d}. page_name: {page_name}, var_name: {var_name}"
        )
    return d


def build_index_html(page_name: str, page_data: dict):
    app_name = page_data.get("app")
    html = get_app_index_html(app_name)

    lang = page_data["page"]["meta"].get("lang")
    if not lang:
        page_data.get("i18n", {}).get("supported", ["en"])[0]

    # meta
    meta = page_data["page"]["meta"]
    for key in meta:
        val = meta.get(key)
        val = val.get(lang, "") if isinstance(val, dict) else val
        val = "" if val is None else val
        html = html.replace("$" + key + "$", f'"{val}"')
    html = html.replace('<title>"', "<title>").replace('"</title>', "</title>")

    # append components.js to head (preload custom elements for faster rendering)
    component_names = get_nested_component_names(page_data)
    # filter out not custom elements
    component_names = [name for name in component_names if "-" in name]
    ui_path = app_name.split("apps")[0].strip("/")
    scripts = []
    for name in component_names:
        url = STATIC_BASE_URL + ui_path + "/components/" + name + "/component.js"
        line = f'<script async src="{url}"></script>'
        scripts.append(line)
    html = html.replace("</head>", "".join(scripts) + "</head>")
    return html


def get_nested_component_names(data: any):
    #   遍历 page_data 树, 找到所有的 component name
    #       若 key name 是 "component", 读取 .name 的 value,
    #       若 key name 是 "components", 读取 .[].name 的 value

    names = []
    if isinstance(data, dict):
        for key in data:
            if key == "component":
                names.append(data[key]["name"])
            elif key == "components" or key.endswith("_components"):
                for item in data[key]:
                    names.append(item["name"])
            else:
                names.extend(get_nested_component_names(data[key]))
    elif isinstance(data, list):
        for item in data:
            names.extend(get_nested_component_names(item))
    else:
        return []

    return names


def get_app_index_html(app_name: str):
    urlpath = app_name.strip("/") + "/index.html.txt"
    destfile = Path(".build").joinpath("ui_static").joinpath(urlpath)
    if destfile.exists():
        return destfile.read_text()

    # else, download from space-ui static files
    url = "https://static.mixin.city/" + urlpath
    destfile.parent.mkdir(parents=True, exist_ok=True)

    rsp = httpx.get(url).raise_for_status()
    text = rsp.text
    destfile.write_text(text)
    return text


def insert_google_analytics(google_tag_id: str, html: str):
    template = """
<script async src="https://www.googletagmanager.com/gtag/js?id=$google_tag_id$"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '$google_tag_id$');
</script>"""

    s = template.replace("$google_tag_id$", google_tag_id).replace("\n", "")
    html = html.replace("</head>", f"{s}</head>")
    return html


if __name__ == "__main__":
    main()
