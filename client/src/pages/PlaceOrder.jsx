import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orderService'
import toast from 'react-hot-toast'
import { HiOutlineCube, HiOutlineDocumentAdd, HiOutlineCalendar, HiOutlineUpload } from 'react-icons/hi'

const PlaceOrder = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([{ productName: '', quantity: '', unit: 'pcs', priority: 'medium', estimatedCost: '' }])
    const [commonDetails, setCommonDetails] = useState({ description: '', deliveryDate: '' })
    const [file, setFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)

    const handleProductChange = (index, e) => {
        const newProducts = [...products]
        newProducts[index][e.target.name] = e.target.value
        setProducts(newProducts)
    }

    const addProductRow = () => {
        setProducts([...products, { productName: '', quantity: '', unit: 'pcs', priority: 'medium', estimatedCost: '' }])
    }

    const removeProductRow = (index) => {
        if (products.length > 1) {
            setProducts(products.filter((_, i) => i !== index))
        }
    }

    const handleCommonChange = (e) => setCommonDetails({ ...commonDetails, [e.target.name]: e.target.value })
    const handleFile = (f) => { if (f && f.size > 10 * 1024 * 1024) return toast.error('File size should be under 10MB'); setFile(f) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Basic validation for all products
        const invalid = products.find(p => !p.productName || !p.quantity)
        if (invalid) return toast.error('Product name and quantity are required for all items')
        
        setLoading(true)
        try {
            // We create separate orders for each product, sharing common details
            const promises = products.map(product => {
                const formData = new FormData()
                // Append product specific fields
                Object.entries(product).forEach(([key, val]) => { if (val) formData.append(key, val) })
                // Append common fields
                Object.entries(commonDetails).forEach(([key, val]) => { if (val) formData.append(key, val) })
                if (file) formData.append('designFile', file)
                return createOrder(formData)
            })

            await Promise.all(promises)
            toast.success(`${products.length} order(s) placed successfully!`)
            navigate('/my-orders')
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Failed to place order(s)') 
        } finally { 
            setLoading(false) 
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Place New Order</h1>
                <p className="text-gray-500 text-sm mt-1">Add one or more products to your order request</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {products.map((product, index) => (
                    <div key={index} className="glass-card p-6 relative group animate-slide-up">
                        {products.length > 1 && (
                            <button type="button" onClick={() => removeProductRow(index)} 
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove product">
                                <span className="text-xl">&times;</span>
                            </button>
                        )}
                        <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <HiOutlineCube className="w-5 h-5 text-red-500" /> Product #{index + 1}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            <div className="md:col-span-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Product Name *</label>
                                <input type="text" name="productName" value={product.productName} onChange={(e) => handleProductChange(index, e)} className="input-field" placeholder="e.g., T-Shirt Printing" required />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Quantity *</label>
                                <input type="number" name="quantity" value={product.quantity} onChange={(e) => handleProductChange(index, e)} className="input-field" placeholder="100" min="1" required />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Unit</label>
                                <select name="unit" value={product.unit} onChange={(e) => handleProductChange(index, e)} className="input-field">
                                    {['pcs', 'kg', 'meters', 'liters', 'boxes', 'sets'].map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Priority</label>
                                <select name="priority" value={product.priority} onChange={(e) => handleProductChange(index, e)} className="input-field">
                                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Estimated Cost (₹)</label>
                                <input type="number" name="estimatedCost" value={product.estimatedCost} onChange={(e) => handleProductChange(index, e)} className="input-field" placeholder="0" min="0" />
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addProductRow} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2 font-medium bg-white/50">
                    <span className="text-xl">+</span> Add Another Product
                </button>

                <div className="glass-card p-8 space-y-6 mt-8">
                    <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-red-500" /> Common Batch Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Expected Delivery Date</label>
                            <input type="date" name="deliveryDate" value={commonDetails.deliveryDate} onChange={handleCommonChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Description / Special Instructions</label>
                            <textarea name="description" value={commonDetails.description} onChange={handleCommonChange} rows="3" className="input-field resize-none" placeholder="Any specific requirements or notes..." />
                        </div>
                    </div>

                    <div className="space-y-5 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><HiOutlineDocumentAdd className="w-5 h-5 text-red-500" /> Share Design File</h3>
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
                            onClick={() => document.getElementById('file-upload').click()}>
                            <input id="file-upload" type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.csv" />
                            <HiOutlineUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            {file ? (<div><p className="text-red-600 font-medium">{file.name}</p><p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>)
                                : (<div><p className="text-gray-500">Drag & drop your design file here</p><p className="text-xs text-gray-400 mt-1">Common for all items in this batch</p></div>)}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : `Place ${products.length} Order(s)`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default PlaceOrder
