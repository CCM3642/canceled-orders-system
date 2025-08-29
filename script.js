// عرض التاريخ والوقت الحالي
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    document.getElementById('current-time').textContent = now.toLocaleTimeString('ar-SA');
}

// تحديث الوقت كل ثانية
setInterval(updateDateTime, 1000);
updateDateTime();

// إدارة البيانات
let orders = JSON.parse(localStorage.getItem('canceledOrders')) || [];

// إضافة طلب جديد
document.getElementById('order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    showLoading();
    
    // تأخير المحاكاة لعرض شاشة التحميل
    setTimeout(() => {
        const order = {
            id: document.getElementById('order-id').value,
            customer: document.getElementById('customer-name').value,
            restaurant: document.getElementById('restaurant').value,
            platform: document.getElementById('platform').value,
            amount: parseFloat(document.getElementById('amount').value),
            reason: document.getElementById('reason').value,
            date: new Date().toISOString().split('T')[0],
            status: "pending", // جديد: تمت إضافته
            whatsappSent: false,
            response: null
        };
        
        orders.push(order);
        localStorage.setItem('canceledOrders', JSON.stringify(orders));
        
        // تحديث قائمة المطاعم في واتساب
        updateRestaurantList();
        
        // إعادة تعيين النموذج
        this.reset();
        document.getElementById('restaurant').value = "CRISPY CHICKEN LU HGG[";
        
        // تحديث العرض
        displayOrders();
        updateStats();
        
        hideLoading();
        showNotification('تمت إضافة الطلب بنجاح!');
    }, 500);
});

// تحديث قائمة المطاعم
function updateRestaurantList() {
    const restaurants = [...new Set(orders.map(o => o.restaurant))];
    const select = document.getElementById('whatsapp-restaurant');
    select.innerHTML = '<option value="">اختر المطعم</option>';
    
    restaurants.forEach(restaurant => {
        const option = document.createElement('option');
        option.value = restaurant;
        option.textContent = restaurant;
        select.appendChild(option);
    });
}

// عرض الطلبات في الجدول
function displayOrders(filteredOrders = orders) {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';
    
    filteredOrders.forEach(order => {
        const statusClass = order.response ? 
            (order.response === "تم التسليم" ? "delivered" : "not-delivered") : "pending";
        
        const row = `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.restaurant}</td>
                <td>${order.platform}</td>
                <td>${order.amount.toFixed(2)} درهم</td>
                <td>${order.reason}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${order.response || "قيد الانتظار"}
                    </span>
                </td>
                <td>
                    <button class="whatsapp-btn" onclick="sendWhatsApp('${order.id}')">
                        <i class="fab fa-whatsapp"></i> واتساب
                    </button>
                    <button class="delete-btn" onclick="deleteOrder('${order.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// إرسال إشعار واتساب
function sendWhatsApp(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const message = `مرحباً ${order.restaurant}، 

تم إلغاء الطلب رقم ${order.id} 

العميل: ${order.customer}
المبلغ: ${order.amount} درهم
السبب: ${order.reason}

يرجى الرد بالسبب الحقيقي`;
    
    // في التطبيق الحقيقي، سيتم إرسال الرسالة عبر API
    // هنا نحاكي الإرسال
    order.whatsappSent = true;
    localStorage.setItem('canceledOrders', JSON.stringify(orders));
    
    // فتح نافذة الرد
    document.getElementById('response-modal').style.display = 'block';
    document.getElementById('response-reason').dataset.orderId = orderId;
    
    showNotification('تم إرسال إشعار الواتساب!');
}

// إرسال الرد
document.getElementById('submit-response').addEventListener('click', function() {
    const orderId = document.getElementById('response-reason').dataset.orderId;
    const response = document.getElementById('response-reason').value;
    
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.response = response;
        order.status = response === "تم التسليم" ? "delivered" : "not-delivered";
        localStorage.setItem('canceledOrders', JSON.stringify(orders));
        
        // تحديث العرض
        displayOrders();
        updateStats();
        
        // إغلاق النافذة
        document.getElementById('response-modal').style.display = 'none';
        
        showNotification(`تم تسجيل الرد: ${response}`);
    }
});

// إرسال إشعار يدوي
document.getElementById('send-whatsapp').addEventListener('click', function() {
    const restaurant = document.getElementById('whatsapp-restaurant').value;
    const message = document.getElementById('whatsapp-message').value;
    const number = document.getElementById('whatsapp-number').value;
    
    if (!restaurant || !message || !number) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // في التطبيق الحقيقي، سيتم إرسال الرسالة عبر API
    // هنا نحاكي الإرسال
    showNotification(`تم إرسال رسالة لـ ${restaurant}`);
    
    // مسح الحقول
    document.getElementById('whatsapp-message').value = '';
    document.getElementById('whatsapp-number').value = '';
});

// إغلاق نافذة الرد
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('response-modal').style.display = 'none';
});

// تصفية حسب التاريخ
document.getElementById('apply-filter').addEventListener('click', function() {
    const filterDate = document.getElementById('filter-date').value;
    if (filterDate) {
        const filtered = orders.filter(order => order.date === filterDate);
        displayOrders(filtered);
        showNotification(`تم تصفية ${filtered.length} طلبات`);
    }
});

// إزالة التصفية
document.getElementById('clear-filter').addEventListener('click', function() {
    document.getElementById('filter-date').value = '';
    displayOrders();
    showNotification('تم إزالة التصفية');
});

// تصدير CSV
document.getElementById('export-csv').addEventListener('click', function() {
    const csv = "data:text/csv;charset=utf-8," + 
        "رقم الطلب,العميل,المطعم,المنصة,المبلغ,السبب,الحالة,التاريخ\n" +
        orders.map(o => `${o.id},${o.customer},${o.restaurant},${o.platform},${o.amount},${o.reason},${o.response || "قيد الانتظار"},${o.date}`).join("\n");
    
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `canceled_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    
    showNotification('تم تصدير الملف بنجاح!');
});

// حذف طلب
function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        orders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('canceledOrders', JSON.stringify(orders));
        displayOrders();
        updateStats();
        showNotification('تم حذف الطلب بنجاح!');
    }
}

// تحديث الإحصائيات
function updateStats() {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalRestaurants = [...new Set(orders.map(o => o.restaurant))].length;
    const completedOrders = orders.filter(o => o.response).length;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-amount').textContent = totalAmount.toFixed(2);
    document.getElementById('total-restaurants').textContent = totalRestaurants;
    document.getElementById('completed-orders').textContent = completedOrders;
}

// شاشة التحميل
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// رسالة إشعار
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    displayOrders();
    updateStats();
    updateRestaurantList();
});
