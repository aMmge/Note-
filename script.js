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
              tags: ["示例", "测试"],
          },
      ];

      // 保存到 localStorage
      database.notes.forEach((note) => {
        saveNoteToLocalStorage(note); // 每个笔记都存储
    });      

      saveDatabase();
  }

  // 确保最近删除分类存在
  if (!database.categories.some((cat) => cat.id === "recentDeleted")) {
      database.categories.push({ id: "recentDeleted", name: "最近删除", notes: [] });
  }

  // 检查 localStorage 是否有主题偏好设置
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
      isDarkMode = true;
      document.body.classList.add('dark-mode');
  }
}

// 在切换主题时保存用户的选择
function toggleTheme() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    body.classList.toggle('dark-mode', isDarkMode);

    // 保存用户选择到 localStorage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
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
        <span>${category.name} (${category.notes.length})</span>
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

  const notes = categoryId === "all"
      ? database.notes
      : database.notes.filter((note) => note.categoryId === categoryId);

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


// 工具函数：去除 HTML 标签
function stripHtmlTags(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
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
        tags: [], // 初始化 tags 字段为空数组
        viewCount: 0, // 初始化查看次数为 0
    };
  
    database.notes.push(newNote);
  
    // 将新笔记 ID 添加到对应分类的 notes 数组中
    const category = database.categories.find((cat) => cat.id === categoryId);
    if (category) {
        category.notes.push(newNote.id);
    }
  
    saveDatabase();
    renderNotes(categoryId); // 重新渲染当前分类下的笔记
    renderNoteEditor(newNote.id); // 打开新建笔记的编辑器
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

// 保存笔记
let selectedNoteId = null; // 当前选中的笔记 ID

// 渲染选中笔记到编辑器
function renderNoteEditor(noteId) {
    const note = database.notes.find((note) => note.id === noteId);
    if (!note) return;
  
    selectedNoteId = noteId;
    document.getElementById("note-title").value = note.title;
    document.getElementById("note-tags").value = note.tags.join(", ");
    document.getElementById("last-modified").innerText = note.lastModified;
    renderTags(note.tags);
  
    // 增加查看次数
    note.viewCount = (note.viewCount || 0) + 1;
    saveDatabase();
  
    if (isMarkdownMode) {
        // 加载到 Markdown 编辑器
        document.getElementById("markdown-input").value = stripHtmlTags(note.content);
        updateMarkdownPreview();
    } else {
        // 加载到富文本编辑器
        quill.root.innerHTML = note.content;
    }
}


// 渲染标签
function renderTags(tags) {
  const tagsContainer = document.getElementById("tags-container");
  tagsContainer.innerHTML = tags.map((tag) => `<div class="tag">${tag}</div>`).join("");
}

// 保存笔记
function saveNote() {
  const title = document.getElementById("note-title").value.trim();
  const tagsInput = document.getElementById("note-tags").value.trim();

  if (!title) {
      alert("笔记标题不能为空！");
      return;
  }

  const tags = tagsInput ? tagsInput.split(",").map((tag) => tag.trim()) : [];

  const note = database.notes.find((n) => n.id === selectedNoteId);
  if (note) {
      note.title = title;
      note.tags = tags;
      note.lastModified = new Date().toISOString().split("T")[0];

      if (isMarkdownMode) {
          // 保存 Markdown 内容
          note.content = document.getElementById("markdown-input").value;
      } else {
          // 保存富文本内容
          note.content = quill.root.innerHTML;
      }
  } else {
      alert("未找到选中的笔记，保存失败！");
  }

  saveDatabase();
  renderNotes(currentCategoryId);
  renderTags(tags);
}


// 实现笔记过滤
let currentCategoryId = "all"; // 当前选中的分类

function filterNotes(categoryId) {
  currentCategoryId = categoryId;
  renderNotes(categoryId);
}

// 搜索笔记
function searchNotes() {
  const searchInput = document.getElementById("search-input").value.trim().toLowerCase();
  const notesList = document.getElementById("notes");

  if (!searchInput) {
      // 如果没有输入，显示当前分类下的所有笔记
      renderNotes(currentCategoryId);
      return;
  }

  // 搜索笔记：标题、内容和标签匹配
  const filteredNotes = database.notes.filter(
      (note) =>
          note.title.toLowerCase().includes(searchInput) ||
          note.content.toLowerCase().includes(searchInput) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchInput))
  );

  // 渲染搜索结果，带关键词高亮
  notesList.innerHTML = filteredNotes
      .map(
          (note) => `
    <li data-note-id="${note.id}" onclick="renderNoteEditor('${note.id}')">
        <span>${highlightKeyword(note.title, searchInput)}</span>
        <button onclick="deleteNote('${note.id}'); event.stopPropagation();">删除</button>
    </li>
  `
      )
      .join("");

  // 如果没有匹配结果
  if (filteredNotes.length === 0) {
      notesList.innerHTML = `<li>未找到匹配的笔记</li>`;
  }
}

// 工具函数：高亮显示关键词
function highlightKeyword(text, keyword) {
  const regex = new RegExp(`(${keyword})`, "gi"); // 匹配关键词，忽略大小写
  return text.replace(regex, "<mark>$1</mark>"); // 使用 <mark> 标签高亮
}

// 绑定搜索事件
document.getElementById("search-btn").addEventListener("click", searchNotes);

// 绑定回车键事件
document.getElementById("search-input").addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
      searchNotes();
  }
});



let isMarkdownMode = false; // 当前是否为 Markdown 模式

// 切换 Markdown 模式
function toggleMarkdownMode() {
  const markdownEditor = document.getElementById("markdown-editor");
  const quillEditor = document.getElementById("note-content-editor");
  const quillToolbar = document.querySelector(".ql-toolbar.ql-snow"); // 获取工具栏
  const toggleButton = document.getElementById("toggle-markdown");

  if (isMarkdownMode) {
      // 切换到富文本编辑器
      markdownEditor.style.display = "none";
      quillEditor.style.display = "block";
      quillToolbar.style.display = "block"; // 显示工具栏
      toggleButton.textContent = "切换到 Markdown 编辑";
  } else {
      // 切换到 Markdown 编辑器
      markdownEditor.style.display = "block";
      quillEditor.style.display = "none";
      quillToolbar.style.display = "none"; // 隐藏工具栏
      toggleButton.textContent = "切换到富文本编辑";

      // 如果当前有选中的笔记，将内容同步到 Markdown 编辑器
      if (selectedNoteId) {
          const note = database.notes.find((n) => n.id === selectedNoteId);
          if (note) {
              document.getElementById("markdown-input").value = stripHtmlTags(note.content);
              updateMarkdownPreview();
          }
      }
  }

  isMarkdownMode = !isMarkdownMode;
}


//markdown-preview 的高度根据内容动态调整
function adjustMarkdownPreviewHeight() {
  const markdownPreview = document.getElementById("markdown-preview");
  const contentHeight = markdownPreview.scrollHeight; // 获取内容高度
  const maxHeight = 200; // 最大高度
  markdownPreview.style.height = `${Math.min(contentHeight, maxHeight)}px`; // 动态设置高度
}



// 更新 Markdown 预览
function updateMarkdownPreview() {
    const markdownInput = document.getElementById("markdown-input").value;
    const markdownPreview = document.getElementById("markdown-preview");
    markdownPreview.innerHTML = marked.parse(markdownInput);
    adjustMarkdownPreviewHeight(); // 动态调整高度
}

// 绑定 Markdown 输入事件
document.getElementById("markdown-input").addEventListener("input", updateMarkdownPreview);

// 绑定切换按钮事件
document.getElementById("toggle-markdown").addEventListener("click", toggleMarkdownMode);

//渲染图表
function renderStatistics() {
    const ctx = document.getElementById('noteStatisticsChart').getContext('2d');

    // 设置Canvas的实际尺寸
    const canvas = document.getElementById('noteStatisticsChart');
    canvas.width = 800;  // 设置为你希望的固定宽度
    canvas.height = 500; // 设置为你希望的固定高度

    // 先清空之前的图表
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 统计每个分类下的笔记数量
    const categories = database.categories.map(cat => cat.name);
    const noteCounts = database.categories.map(cat => cat.notes.length);

    // 统计笔记的查看次数
    const viewCounts = database.notes.map(note => note.viewCount || 0);

    const chart = new Chart(ctx, {
        type: 'bar', // 使用柱状图
        data: {
            labels: categories,
            datasets: [{
                label: '笔记数量',
                data: noteCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: '查看次数',
                data: viewCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: false, // 使图表响应式
            maintainAspectRatio: false, // 让图表根据容器大小调整
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
}

  
// 绑定图片点击事件
document.getElementById('show-chart').addEventListener('click', function() {
    // 显示弹窗
    document.getElementById('chart-modal').style.display = 'block';
    
    // 每次打开时渲染图表
    renderStatistics();
});

// 绑定关闭弹窗事件
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('chart-modal').style.display = 'none';
});

// 关闭弹窗时点击外部也关闭
window.onclick = function(event) {
    const modal = document.getElementById('chart-modal');
    if (event.target === modal) {
        modal.style.display = "none";
    }
};



// 保存数据到 localStorage
function saveDatabase() {
    console.log("保存数据到 localStorage:", database); // 调试日志，检查保存的数据
    localStorage.setItem("noteAppData", JSON.stringify(database));
  }
  
  // 获取分享链接中的 noteId 参数
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get('id');
  
  // 从 localStorage 获取数据
  const storedData = localStorage.getItem('noteAppData');
  console.log("从 localStorage 获取到的笔记数据:", storedData); // 调试日志
  
  if (storedData) {
    Object.assign(database, JSON.parse(storedData)); // 这里不再重新声明 `database`
  }
  
  if (noteId) {
      // 查找笔记
      const note = database.notes.find(n => n.id === noteId);
  
      if (note) {
          // 如果找到笔记，显示标题和内容
          document.getElementById('note-title').innerText = note.title;
          quill.root.innerHTML = note.content; // 使用 Quill 设置内容
      } else {
          document.getElementById('note-title').innerText = '笔记未找到';
      }
  } else {
      document.getElementById('note-title').innerText = '无效的分享链接';
  }


function generateShareLink() {
    if (selectedNoteId) {
        const shareLink = `${window.location.origin}/note.html?id=${selectedNoteId}`;
        alert(`分享链接已生成: ${shareLink}`);
    } else {
        alert("请先选择一个笔记。");
    }
}


// 导出笔记为 markdown 格式
function exportToMarkdown() {
    const note = database.notes.find((n) => n.id === selectedNoteId);
    if (!note) {
        alert("未找到选中的笔记，导出失败！");
        return;
    }

    const markdownContent = `# ${note.title}\n\n${note.content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 释放URL对象
}

// 绑定图标点击事件
document.getElementById("share-note").addEventListener("click", generateShareLink);
document.getElementById("export-note").addEventListener("click", exportToMarkdown);


let isDarkMode = false;

// 切换主题
function toggleTheme() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    body.classList.toggle('dark-mode', isDarkMode);

    // 这里可以遍历所有相关元素，确保它们的样式会被更新
    document.querySelectorAll('.note-editor').forEach(editor => {
        if (isDarkMode) {
            editor.style.background = '#2a2a2a'; // 夜间模式背景
            editor.style.color = '#ffffff'; // 夜间模式文字颜色
        } else {
            editor.style.background = '#fff'; // 默认背景
            editor.style.color = '#000'; // 默认文字颜色
        }
    });

    // 保存用户选择到 localStorage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
}

// 绑定切换主题按钮事件
document.getElementById("toggle-theme").addEventListener("click", toggleTheme);





// 初始化
initDatabase();
renderCategories();
renderNotes();
renderStatistics(); // 渲染统计图表

// 初始化 Quill 编辑器
const quill = new Quill("#note-content-editor", {
  theme: "snow", // 使用 snow 主题
  modules: {
      toolbar: [
          [{ header: [1, 2, 3, false] }], // 标题
          ["bold", "italic", "underline", "strike"], // 加粗、斜体、下划线、删除线
          [{ list: "ordered" }, { list: "bullet" }], // 有序列表、无序列表
          ["link", "table"], // 链接、表格
          [{ color: [] }, { background: [] }], // 字体颜色、背景颜色
          ["clean"], // 清除格式
      ],
  },
});

// 绑定事件
document.getElementById("add-category").addEventListener("click", addCategory);
document.getElementById("new-note").addEventListener("click", addNote);
document.getElementById("save-note").addEventListener("click", saveNote);