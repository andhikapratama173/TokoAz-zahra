// --- DEKLARASI DATA & INISIALISASI ---
let products = JSON.parse(localStorage.getItem('warung_products')) || [
    { id: 1, name: 'Kopi Hitam', price: 3000, stock: 20 },
    { id: 2, name: 'Mie Instan', price: 3500, stock: 50 },
    { id: 3, name: 'Es Teh Manis', price: 4000, stock: 15 }
];

let cart = [];

// DOM Elements
const stockTableBody = document.getElementById('stock-table-body');
const selectProduct = document.getElementById('select-product');
const cartTableBody = document.getElementById('cart-table-body');
const cartTotalEl = document.getElementById('cart-total');
const payAmountInput = document.getElementById('pay-amount');
const changeAmountEl = document.getElementById('change-amount');

const formProduct = document.getElementById('form-product');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const btnSaveProduct = document.getElementById('btn-save-product');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// --- RENDERING TAMPILAN ---

// Simpan data ke LocalStorage
function saveProductsToStorage() {
    localStorage.setItem('warung_products', JSON.stringify(products));
}

// Tampilkan Tabel Stok
function renderStockTable() {
    stockTableBody.innerHTML = '';
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>Rp ${product.price.toLocaleString('id-ID')}</td>
            <td><strong>${product.stock}</strong></td>
            <td>
                <button class="btn btn-warning" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Hapus</button>
            </td>
        `;
        stockTableBody.appendChild(tr);
    });
    renderSelectOptions();
}

// Tampilkan Opsi Dropdown Kasir
function renderSelectOptions() {
    selectProduct.innerHTML = '<option value="">-- Pilih Barang --</option>';
    products.forEach(product => {
        if (product.stock > 0) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Rp ${product.price.toLocaleString('id-ID')}) - Stok: ${product.stock}`;
            selectProduct.appendChild(option);
        }
    });
}

// Tampilkan Keranjang
function renderCartTable() {
    cartTableBody.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>Rp ${item.price.toLocaleString('id-ID')}</td>
            <td>${item.qty}</td>
            <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td>
                <button class="btn btn-danger" onclick="removeFromCart(${index})">Batal</button>
            </td>
        `;
        cartTableBody.appendChild(tr);
    });

    cartTotalEl.textContent = total.toLocaleString('id-ID');
    calculateChange();
}

// --- LOGIKA MANAJEMEN STOK (CRUD) ---

// Tambah atau Update Produk
formProduct.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = productIdInput.value;
    const name = productNameInput.value;
    const price = parseInt(productPriceInput.value);
    const stock = parseInt(productStockInput.value);

    if (id) {
        // Mode Edit
        const product = products.find(p => p.id == id);
        if (product) {
            product.name = name;
            product.price = price;
            product.stock = stock;
        }
    } else {
        // Mode Tambah
        const newProduct = {
            id: Date.now(),
            name,
            price,
            stock
        };
        products.push(newProduct);
    }

    saveProductsToStorage();
    resetProductForm();
    renderStockTable();
});

// Edit Produk
window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productPriceInput.value = product.price;
        productStockInput.value = product.stock;

        btnSaveProduct.textContent = 'Simpan Perubahan';
        btnCancelEdit.style.display = 'inline-block';
    }
};

// Batal Edit
btnCancelEdit.addEventListener('click', resetProductForm);

function resetProductForm() {
    productIdInput.value = '';
    formProduct.reset();
    btnSaveProduct.textContent = 'Tambah Barang';
    btnCancelEdit.style.display = 'none';
}

// Hapus Produk
window.deleteProduct = function(id) {
    if (confirm('Yakin ingin menghapus barang ini?')) {
        products = products.filter(p => p.id !== id);
        saveProductsToStorage();
        renderStockTable();
    }
};

// --- LOGIKA KASIR (POS) ---

// Tambah ke Keranjang
document.getElementById('btn-add-to-cart').addEventListener('click', () => {
    const productId = parseInt(selectProduct.value);
    const qty = parseInt(document.getElementById('cart-qty').value);

    if (!productId || qty <= 0) {
        alert('Pilih barang dan jumlah unit yang valid.');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Cek stok yang ada di keranjang
    const existingCartItem = cart.find(item => item.id === productId);
    const totalQtyInCart = existingCartItem ? existingCartItem.qty + qty : qty;

    if (totalQtyInCart > product.stock) {
        alert(`Stok tidak mencukupi! Stok tersedia: ${product.stock}`);
        return;
    }

    if (existingCartItem) {
        existingCartItem.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: qty
        });
    }

    document.getElementById('cart-qty').value = 1;
    renderCartTable();
});

// Hapus Item dari Keranjang
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCartTable();
};

// Hitung Kembalian
function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const pay = parseInt(payAmountInput.value) || 0;
    const change = pay - total;

    if (pay >= total && total > 0) {
        changeAmountEl.textContent = change.toLocaleString('id-ID');
    } else {
        changeAmountEl.textContent = '0';
    }
}

payAmountInput.addEventListener('input', calculateChange);

// Proses Bayar & Potong Stok
document.getElementById('btn-checkout').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Keranjang masih kosong!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const pay = parseInt(payAmountInput.value) || 0;

    if (pay < total) {
        alert('Uang pembayaran kurang!');
        return;
    }

    // Kurangi stok barang
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.qty;
        }
    });

    saveProductsToStorage();
    renderStockTable();

    alert(`Transaksi Berhasil!\nTotal: Rp ${total.toLocaleString('id-ID')}\nKembalian: Rp ${(pay - total).toLocaleString('id-ID')}`);

    // Reset Keranjang
    cart = [];
    payAmountInput.value = '';
    renderCartTable();
});

// Jalankan saat halaman pertama dibuka
renderStockTable();