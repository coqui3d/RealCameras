

THREE.TestShader = {
	uniforms: {
		"tColor": { type: "t", value:null},
		"tDepth": { type: "t", value: null},
		"znear": {type: "f", value: 1.00},
		"zfar": {type: "f", value: 100},
		"dfar": {type: "f", value: 0},
		"dnear": {type: "f", value:0}
	},

	vertexShader:[
		"varying vec2 vUv;",

		"void main() {"
			"vUv =uv;",
			"gl_position = projectionMatrix *modelViewMatrix *vec4(position, 1.0);",
		"}"
	].join("\n"),

	fragmentShader: [
		"varying vec vUv;",

		"uniform sampler2D tColor;",
		"uniform sampler2D tDepth;",
		"uniform float znear",
		"uniform float zfar",
		"uniform float dnear",
		"uniform float dfar",

		"float shift (vec4 text){",
			"const vec4 bitshifts = vec4(1.0/256.0*256.0*256.0),",
									"1.0/(256.0*256.0),",
									"1.0/256.0,",
									"1.0);",
			"return dot(text, bitshifts);",
		"}",
		"void main() {",

			"float depth = shift(texture2D(tDepth, vUv));",
			"//float zdist = (znear *zfar)/(zfar - depth * (zfar- znear));",
			
			"float kernel[3][3];",
			"kernel[-1][1]=1.0/16.0; kernel[0][1]=2.0/16.0; kernel[1][1]=1.0/16.0;",
			"kernel[-1][0]=2.0/16.0; kernel[0][0]=4.0/16.0; kernel[1][0]=2.0/16.0;",
			"kernel[-1][-1]=1.0/16.0; kernel[0][-1]=2.0/16.0; kernel[1][-1]=1.0/16.0;",

			"float textelsize = 0.0;",
			"if (depth > dfar && dfar > 0)",
				"textelsize = (depth -dfar)*0.2;",
			"else if (depth < near)",
				"textelsize = (dnear - depth)*0.2;",
			"if (textelsize > (1.0/256.0))",
				"textelsize = 1.0/256.0;",

			"vec3 colour = vec3(0,0,0);",
			"int count =0;",
			"for (int x=-1; x<2; x++) {",
				"for (int y=-1; y<2; y++) {",
					"vec2 offset = vUv + vec2(float(x), float(y))*textelsize;",
					"if ( (offset.x >= 0.0) && (offset.x <= 1.0) && (offset.y >= 0.0) && (offset.y <= 1.0) ){",
						"colour += (texture2D(tColor, offset).xyz)*kernel[x][y]; ",
						"++count;",
					"}",
				"}",
			"}",
			"if (count >0)",
				"colour /= float(count);",
			"else",
				"colour = texture2D(tColor,vUv).xyz;",

			"gl_FragColor.xyz = colour.xyz;",
			"gl_FragColor.w = 1.0;",

		"}"
	].join("\n")
};