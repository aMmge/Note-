// 数据库模拟对象
const database = {
    categories: [],
    notes: [],
  };
  
  // 初始化数据存储
  function initDatabase() {
    const storedData = localStorage.getItem("noteAppData");
  
    if (storedData) {
      // 加载本地存储的数据
      Object.assign(database, JSON.parse(storedData));
  
      // 检查 notes 中是否存在 tags 字段，没有则初始化为空数组
      database.notes.forEach((note) => {
        if (!note.tags) {
          note.tags = []; // 初始化 tags 字段为空数组
        }
      });
  
    } else {
      // 如果没有存储数据，初始化默认数据
      database.categories = [
        { id: "default", name: "未分类", notes: [] },
        { id: "work", name: "工作", notes: [] },
        { id: "recentDeleted", name: "最近删除", notes: [] },
      ];
      database.notes = [
        {
          id: generateId("note"),
          title: "示例笔记",
          content: "这是一个示例笔记内容",
          lastModified: new Date().toISOString().split("T")[0],
          categoryId: "default",
          tags: ["示例", "测试"]
        }
      ];
      saveDatabase();
    }
  
    // 确保最近删除分类存在
    if (!database.categories.some((cat) => cat.id === "recentDeleted")) {
      database.categories.push({ id: "recentDeleted", name: "最近删除", notes: [] });
    }
  }
  
  
  
  // 保存数据到 localStorage
  function saveDatabase() {
    localStorage.setItem("noteAppData", JSON.stringify(database));
  }
  
  // 工具函数：生成唯一 ID
  function generateId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 渲染分类
  function renderCategories() {
    const categoryList = document.getElementById("category-list");
    categoryList.innerHTML = database.categories
      .map(
        (category) => `
        <li data-category-id="${category.id}" onclick="filterNotes('${category.id}')">
          <span>${category.name}</span>
          ${
            category.id !== "default"
              ? `<button class="edit-category-btn" onclick="editCategory('${category.id}'); event.stopPropagation();">编辑</button>
                 <button class="delete-category-btn" onclick="deleteCategory('${category.id}'); event.stopPropagation();">删除</button>`
              : ""
          }
        </li>
      `
      )
      .join("");
  }
  
  
  // 渲染笔记列表
  function renderNotes(categoryId = "default") {
    const notesList = document.getElementById("notes");
    const filterTag = document.getElementById("filter-tags").value;

    let notes = categoryId === "all"
      ? database.notes
      : database.notes.filter((note) => note.categoryId === categoryId);

    if (filterTag !== "all") {
      notes = notes.filter((note) => note.tags.includes(filterTag));
    }

    notesList.innerHTML = notes
      .map(
        (note) => `
      <li data-note-id="${note.id}" onclick="renderNoteEditor('${note.id}')">
        <span>${note.title}</span>
        <button onclick="deleteNote('${note.id}'); event.stopPropagation();">删除</button>
      </li>
    `
      )
      .join("");
  }

  
  function renderTags() {
    const filterTags = document.getElementById("filter-tags");
    const allTags = [...new Set(database.notes.flatMap((note) => note.tags))];
    filterTags.innerHTML = `
      <option value="all">全部标签</option>
      ${allTags.map((tag) => `<option value="${tag}">${tag}</option>`).join("")}
    `;
  }
  
  
  
  // 添加新分类
  function addCategory() {
    const newCategoryInput = document.getElementById("new-category");
    const name = newCategoryInput.value.trim();
  
    if (!name) {
      alert("分类名称不能为空！");
      return;
    }
  
    if (database.categories.some((category) => category.name === name)) {
      alert("分类名称不能重复！");
      return;
    }
  
    const newCategory = { id: generateId("category"), name, notes: [] };
    database.categories.push(newCategory);
    saveDatabase();
    renderCategories();
    newCategoryInput.value = "";
  }
  
  // 编辑分类名称
  function editCategory(categoryId) {
    const category = database.categories.find((cat) => cat.id === categoryId);
    const newName = prompt("请输入新的分类名称：", category.name);
  
    if (!newName) {
      alert("分类名称不能为空！");
      return;
    }
  
    if (database.categories.some((cat) => cat.name === newName)) {
      alert("分类名称不能重复！");
      return;
    }
  
    category.name = newName;
    saveDatabase();
    renderCategories();
  }
  
  // 删除分类
  function deleteCategory(categoryId) {
    if (!confirm("确定要删除该分类吗？")) return;
  
    const index = database.categories.findIndex((cat) => cat.id === categoryId);
    if (index !== -1) {
      const category = database.categories[index];
  
      // 将分类中的笔记移动到“未分类”
      category.notes.forEach((noteId) => {
        const note = database.notes.find((n) => n.id === noteId);
        note.categoryId = "default";
      });
  
      database.categories.splice(index, 1);
      saveDatabase();
      renderCategories();
      renderNotes("default");
    }
  }
  
  // 添加新笔记
  function addNote() {
    const categoryId = currentCategoryId === "all" ? "default" : currentCategoryId;
  
    const newNote = {
      id: generateId("note"),
      title: "新建笔记",
      content: "",
      lastModified: new Date().toISOString().split("T")[0],
      categoryId,
      tags: [] // 初始化 tags 字段为空数组
    };
  
    database.notes.push(newNote);
  
    // 将新笔记 ID 添加到对应分类的 notes 数组中
    const category = database.categories.find((cat) => cat.id === categoryId);
    if (category) {
      category.notes.push(newNote.id);
    }
  
    saveDatabase();
    renderNotes(categoryId); // 重新渲染当前分类下的笔记
  }
  
  
  
  // 删除笔记
  function deleteNote(noteId) {
    const noteIndex = database.notes.findIndex((note) => note.id === noteId);
    if (noteIndex !== -1) {
      const note = database.notes[noteIndex];
      
      // 如果当前分类是“最近删除”，真正删除
      if (note.categoryId === "recentDeleted") {
        database.notes.splice(noteIndex, 1);
      } else {
        const category = database.categories.find(
          (cat) => cat.id === note.categoryId
        );
  
        // 从原分类中移除
        const noteInCategoryIndex = category.notes.indexOf(noteId);
        if (noteInCategoryIndex !== -1) {
          category.notes.splice(noteInCategoryIndex, 1);
        }
  
        // 移动到“最近删除”
        note.categoryId = "recentDeleted";
        const recentDeletedCategory = database.categories.find(
          (cat) => cat.id === "recentDeleted"
        );
        recentDeletedCategory.notes.push(noteId);
      }
  
      saveDatabase();
      renderNotes(currentCategoryId);
    }
  }
  

  //保存笔记
  let selectedNoteId = null; // 当前选中的笔记 ID

    // 渲染选中笔记到编辑器
    function renderNoteEditor(noteId) {
      const note = database.notes.find((note) => note.id === noteId);
      if (!note) return;

      selectedNoteId = noteId; // 确保设置 selectedNoteId
      document.getElementById("note-title").value = note.title;
      document.getElementById("note-content").value = note.content;
      document.getElementById("note-tags").value = note.tags.join(", ");
      document.getElementById("last-modified").innerText = note.lastModified;
    }

    // 保存笔记
    function saveNote() {
      const title = document.getElementById("note-title").value.trim();
      const content = document.getElementById("note-content").value.trim();
      const tagsInput = document.getElementById("note-tags").value.trim();
    
      if (!title) {
        alert("笔记标题不能为空！");
        return;
      }
    
      const tags = tagsInput ? tagsInput.split(",").map((tag) => tag.trim()) : [];
    
      const note = database.notes.find((n) => n.id === selectedNoteId); // 查找正在编辑的笔记
      if (note) {
        note.title = title;
        note.content = content;
        note.tags = tags;
        note.lastModified = new Date().toISOString().split("T")[0];
      } else {
        alert("未找到选中的笔记，保存失败！");
      }
    
      saveDatabase();
      renderNotes(currentCategoryId); // 更新列表
    }
    
    

    //实现笔记过滤
    let currentCategoryId = "all"; // 当前选中的分类

    function filterNotes(categoryId) {
    currentCategoryId = categoryId;
    renderNotes(categoryId);
    }


  // 初始化
  initDatabase();
  renderCategories();
  renderNotes();
  
  // 绑定事件
  document.getElementById("add-category").addEventListener("click", addCategory);
  document.getElementById("new-note").addEventListener("click", addNote);
  document.getElementById("save-note").addEventListener("click", saveNote);
