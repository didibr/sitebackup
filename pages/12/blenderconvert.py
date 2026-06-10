import bpy
import sys
import os

from PIL import Image  # Pillow para redimensionar
import shutil

# Argumentos
argv = sys.argv
argv = argv[argv.index("--") + 1:]

if len(argv) < 2:
    print("❌ Uso: input_file output.fbx")
    sys.exit(1)

input_path = argv[0]
output_path = argv[1]
input_ext = os.path.splitext(input_path)[1].lower()

# Caminho temporário para imagens redimensionadas
temp_tex_dir = "/tmp/fbx_textures"
os.makedirs(temp_tex_dir, exist_ok=True)

print(f"📦 Importando: {input_path}")
print(f"📤 Exportando para: {output_path}")

bpy.ops.wm.read_factory_settings(use_empty=True)

# Importa modelo
if input_ext in [".glb", ".gltf"]:
    bpy.ops.import_scene.gltf(filepath=input_path)
elif input_ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=input_path)
elif input_ext == ".dae":
    bpy.ops.wm.collada_import(filepath=input_path)
else:
    print(f"❌ Formato de entrada não suportado: {input_ext}")
    sys.exit(2)

# Redimensiona texturas
print("🖼️ Redimensionando texturas para 1024x1024...")
for img in bpy.data.images:
    if not img.filepath or not img.has_data:
        continue

    try:
        orig_path = bpy.path.abspath(img.filepath_raw or img.filepath)
        if not os.path.isfile(orig_path):
            continue

        img_pil = Image.open(orig_path)
        img_resized = img_pil.resize((1024, 1024), Image.LANCZOS)

        new_path = os.path.join(temp_tex_dir, os.path.basename(orig_path))
        img_resized.save(new_path)

        img.filepath = new_path
        img.reload()

        print(f"✅ {os.path.basename(orig_path)} redimensionada.")
    except Exception as e:
        print(f"⚠️ Erro ao processar {img.name}: {e}")


#redimenciona materiais
def simplify_materials():
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue

        bsdf = None
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                bsdf = node
                break

        if not bsdf:
            continue

        tex_node = None
        for link in mat.node_tree.links:
            if link.to_node == bsdf and link.to_socket.name == 'Base Color':
                if link.from_node.type == 'TEX_IMAGE':
                    tex_node = link.from_node
                    break

        if tex_node:
            print(f"🎨 Ajustando material: {mat.name}")
            # Cria novo material sem nodes
            mat.use_nodes = False
            mat.diffuse_color = (1, 1, 1, 1)
            tex_img = tex_node.image
            if tex_img:
                mat.texture_slots.add()
                slot = mat.texture_slots[0]
                slot.texture = bpy.data.textures.new("Tex", type='IMAGE')
                slot.texture.image = tex_img
simplify_materials()


# Exporta FBX com texturas embutidas
print("📤 Exportando para FBX com texturas...")
bpy.ops.export_scene.fbx(
    filepath=output_path,
    use_selection=False,
    apply_unit_scale=True,
    apply_scale_options='FBX_SCALE_UNITS',
    bake_space_transform=False,
    object_types={'MESH', 'ARMATURE'},
    add_leaf_bones=False,
    path_mode='COPY',
    embed_textures=True
)

print("✔️ Conversão concluída.")
